const cred = require('./appEnv')
const vcap = cred.system_env_json.VCAP_SERVICES;
const appenv = cred.application_env_json.VCAP_APPLICATION;
let tempurl = appenv.application_uris[0].split("srv");
let mockserverurl = appenv.organization_name+'-'+appenv.space_name+'-mock-srv'+tempurl[1];
mockserverurl = mockserverurl.replace(/_/g, '-')
let logisticsPartner = appenv.organization_name+'-'+appenv.space_name+'-logistics-partner-srv'+tempurl[1];
logisticsPartner = logisticsPartner.replace(/_/g, '-');


module.exports = {
    "token_url": vcap.xsuaa[0].credentials.url,
    "service_domain": 'https://' + appenv.application_uris[0],
    "mock_service_domain":'https://' + mockserverurl,
    "logistics_service_domain": "https://" + logisticsPartner,
    "xsuaa": {
        "grant_type": "password",
        "client_id": vcap.xsuaa[0].credentials.clientid,
        "client_secret": vcap.xsuaa[0].credentials.clientsecret,
        "username": cred.USERNAME,
        "password": cred.PASSWORD

    },
    s4c:  "https://my304263.s4hana.ondemand.com/sap/opu/odata/sap/API_BUSINESS_PARTNER",
    s4cuser: cred.s4cUser,
    s4cpass: cred.s4cPass,
    SalesUser: cred.SalesUser,
    SalesPass: cred.SalesPass,
    SalesCloud: "https://my360686.crm.ondemand.com/sap/c4c/odata/v1/c4codataapi"
}
