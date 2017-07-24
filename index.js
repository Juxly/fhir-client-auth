import Promise from 'promise-polyfill'
import Flow from './flow'
import Smart from './smart'
import JWT from './jwt'
import Util from './util'

module.exports = {
  ready: ready
}

if (!window.Promise) {
  window.Promise = Promise
}

function getPreviousToken () {
  var state = Util.getParam('state')
  return JSON.parse(sessionStorage[state]).tokenResponse
}

function completePageReload () {
  return new Promise(function (resolve, reject) {
    process.nextTick(function () {
      resolve(getPreviousToken())
    })
  })
}

function readyArgs () {
  var input = null
  var callback = function () {}
  var errback = function () {}

  if (arguments.length === 0) {
    throw new Error('Cannot call ready without arguments')
  } else if (arguments.length === 1) {
    callback = arguments[0]
  } else if (arguments.length === 2) {
    if (typeof arguments[0] === 'function') {
      callback = arguments[0]
      errback = arguments[1]
    } else if (typeof arguments[0] === 'object') {
      input = arguments[0]
      callback = arguments[1]
    } else {
      throw new Error('ready called with invalid arguments')
    }
  } else if (arguments.length === 3) {
    input = arguments[0]
    callback = arguments[1]
    errback = arguments[2]
  } else {
    throw new Error('ready called with invalid arguments')
  }

  return {
    input: input,
    callback: callback,
    errback: errback
  }
}

/**
* Check the tokenResponse object to see if it is valid or not.
* This is to handle the case of a refresh/reload of the page
* after the token was already obtain.
* @return boolean
*/
function validTokenResponse () {
  var args = arguments
  var state = Util.getParam('state') || (args.input && args.input.state)
  return (state && sessionStorage[state] && JSON.parse(sessionStorage[state]).tokenResponse)
}

function ready (input, callback, errback) {
  var args = readyArgs.apply(this, arguments)

  // decide between token flow (implicit grant) and code flow (authorization code grant)
  var isCode = Util.getParam('code') || (args.input && args.input.code)

  var accessTokenResolver = null

  if (validTokenResponse()) { // we're reloading after successful completion
    accessTokenResolver = completePageReload()
  } else if (isCode) { // code flow
    accessTokenResolver = Flow.code(args.input)
  } else { // token flow
    accessTokenResolver = Flow.token(args.input)
  }
  accessTokenResolver.then(function (tokenResponse) {
    if (!tokenResponse || !tokenResponse.state) {
      return args.errback('No state parameter found in authorization response.')
    }

    // Save the tokenResponse object and the state into sessionStorage keyed by state
    sessionStorage[tokenResponse.state] = JSON.stringify(Util.extend(JSON.parse(sessionStorage[tokenResponse.state]), { tokenResponse: tokenResponse }))

    var state = JSON.parse(sessionStorage[tokenResponse.state])
    if (state.fake_token_response) {
      tokenResponse = state.fake_token_response
    }

    var fhirClientParams = {
      serviceUrl: state.provider.url,
      patientId: tokenResponse.patient
    }

    if (tokenResponse.id_token) {
      var id_token = tokenResponse.id_token // eslint-disable-line
      var payload = JWT.decode(id_token)
      fhirClientParams['userId'] = payload['profile']
    }

    if (tokenResponse.access_token) {
      fhirClientParams.auth = {
        type: 'bearer',
        token: tokenResponse.access_token
      }
    } else if (!state.fake_token_response) {
      return args.errback('Failed to obtain access token.')
    }

    var smart = new Smart(fhirClientParams)
    smart.state = JSON.parse(JSON.stringify(state))
    smart.tokenResponse = JSON.parse(JSON.stringify(tokenResponse))
    args.callback(smart)
  }, function () {
    args.errback('Failed to obtain access token.')
  })
}
