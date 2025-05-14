const chai = require('chai');
const chaiHttp = require('chai-http');
const config = require('./config');
let xsuaa_access_token;

// Configure chai

chai.use(chaiHttp);
chai.should();
const BP = new Date().getTime().toString().substring(8);
console.log("BP == ", BP)
const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//S/4HANA Cloud Get call

describe("S/4HANA Business Partner API", () => {
    describe("Should fetch a Business Partner", () => {
        it("should fetch Business Partner with ID 1001601", async () => {
            const encodedAuth = Buffer.from(`${config.s4cuser}:${config.s4cpass}`).toString('base64');
            const req_headers = {
                'Authorization': `Basic ${encodedAuth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            const response = await chai.request(config.s4c)
                .get(`/A_BusinessPartner('1001601')`)
                .set(req_headers);
            response.should.have.status(200);
            response.body.should.be.a('object');
            console.log(response.body);
        });
    });
});

//S/4HANA Cloud Get CSRF TOKEN

let csrfToken = '';
let businessPartnerId = '';
let cookies = '';

describe("S/4HANA OData - CSRF Token Fetch", () => {
    it("should fetch a CSRF token using Basic Auth", async () => {
        const encodedAuth = Buffer.from(`${config.s4cuser}:${config.s4cpass}`).toString('base64');
        const req_headers = {
            'x-csrf-token': 'fetch',
            'Authorization': `Basic ${encodedAuth}`
        };
        const response = await chai.request(config.s4c)
            .get('/')
            .set(req_headers);
        response.should.have.status(200);
        response.header.should.have.property('x-csrf-token');
        // ✅ Save CSRF token to global variable
        csrfToken = response.header['x-csrf-token'];
        cookies = csrfFetchResponse.header['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
        console.log("Fetched CSRF Token:", csrfToken);
    });
});

//S/4HANA Cloud Create BP and extract BP ID

describe("S/4HANA OData - Create Business Partner", () => {
    it("should create a Business Partner", async () => {
        const encodedAuth = Buffer.from(`${config.s4cuser}:${config.s4cpass}`).toString('base64');
        const req_headers = {
            'x-csrf-token': csrfToken, // Use the fetched CSRF token
            'Authorization': `Basic ${encodedAuth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cookie': cookies
        };
        const requestBody = {
            "BusinessPartnerCategory": "1",
            "BusinessPartner": "",
            "LastName": "Granger",
            "FirstName": "Hermione",
            "CorrespondenceLanguage": "EN",
            "BusinessPartnerType": "",
            "to_BusinessPartnerAddress": [
                {
                    "Country": "DE",
                    "PostalCode": "10001",
                    "CityName": "Berlin",
                    "StreetName": "5th Avenue",
                    "HouseNumber": "1"
                }
            ],
            "to_BusinessPartnerRole": [
                {
                    "BusinessPartnerRole": "FLCU01"
                }
            ],
            "to_Customer": {
                "Customer": ""
            }
        };
        const response = await chai.request(config.s4c)
            .post('/A_BusinessPartner')
            .set(req_headers)
            .send(requestBody);
        console.log(csrfToken);
        response.should.have.status(201); // Check for successful creation (201)       
        // Extract the BusinessPartner ID from the response
        businessPartnerId = response.body.d.BusinessPartner; 
        console.log("Created Business Partner ID:", businessPartnerId);
    });
});

async function retry(url, suffix, token){
    const res = await chai.request(url)
            .get(suffix).set('Authorization', 'bearer ' + token);
    return res;
}

//Find BP in Georel App

describe("get access token for xsuaa", () => {
    describe("Should Get access token for xsuaa", () => {
        it(" should fetch access token", async () => {
            var req_headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
            const response = await chai.request(config.token_url)
                .post('/oauth/token').set(req_headers).send(config.xsuaa);
                response.should.have.status(200);
                xsuaa_access_token = response.body.access_token;
        });

    });
});
describe('Business partner read', () => {
    describe('Should get BusinessPartners via Graph', () => {
        it('+ should return a top business partners with Graph and mock S/4', async () => {
            const response = await chai.request(config.service_domain)
                .get('/odata/v4/geo/BusinessPartner/1000000').set('Authorization', 'bearer ' + xsuaa_access_token);

                response.should.have.status(200);
        });
        it('+ New Customer in Georel', async () => {
            // Creation takes time with replication to c4c
            // default timeout
            await sleep(5000)
            var retryAsserts = 60, count=1;
            while(retryAsserts > 0){
                console.log('RETRY: ' + count + ' of 60');
                var res = await retry(config.service_domain, `/odata/v4/geo/CustomerProcesses?$filter=customerId eq '${businessPartnerId}'`, xsuaa_access_token);
                var {value} = res.body;
                res.should.have.status(200);
                console.log("value: ", value);
                await sleep(2000);
                retryAsserts--;
                count++;
            }          
        });
});
});

//Find BP in Sales Cloud System

describe("Sales Cloud Corporate Account API", () => {
    describe("Should verify if a Business Partner exists", () => {
        it("should return 200 and a non-empty result for created BP", async () => {
            const encodedAuth = Buffer.from(`${config.SalesUser}:${config.SalesPass}`).toString('base64');
            const req_headers = {
                'Authorization': `Basic ${encodedAuth}`,
                'Accept': 'application/json'
            };

            const response = await chai.request(config.c4c)
                .get(`/CorporateAccountCollection?$filter=ExternalID eq '${businessPartnerId}'`)
                .set(req_headers);

            response.should.have.status(200);
            response.body.d.results.should.be.an('array').with.length.above(0);
        });
    });
});



