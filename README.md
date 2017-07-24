# FHIR-Client-Auth
A zero depedency library (Okay, one polyfill is required for promises in IE11) and drop in replacement to manage code/token flows in SMART Apps. This will get the token and store it in session storage. It is used with [FHIR-Client.js](https://github.com/smart-on-fhir/client-js) and [FHIR-Client.js](https://github.com/Juxly/fhir-launch-client-auth). 16KB minified

### Usage
Add script to index.html

FHIRAuth.ready(function (smartObj) {

})
