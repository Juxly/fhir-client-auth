import Util from './util'
class Flow {
  token (hash) {
    if (!hash) hash = window.location.hash
    return Promise(function (resolve, reject) {
      let oauthResult = hash.match(/#(.*)/)
      oauthResult = oauthResult ? oauthResult[1] : ''
      oauthResult = oauthResult.split(/&/)
      let authorization = {}
      for (var i = 0; i < oauthResult.length; i++) {
        let kv = oauthResult[i].split(/=/)
        if (kv[0].length > 0 && kv[1]) {
          authorization[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1])
        }
      }
      resolve(authorization)
    })
  }

  code (params) {
    if (!params) {
      params = {
        code: Util.getParam('code'),
        state: Util.getParam('state')
      }
    }
    var state = JSON.parse(sessionStorage[params.state])

    // Using window.history.pushState to append state to the query param.
    // This will allow session data to be retrieved via the state param.
    if (window.history.pushState) {
      var queryParam = window.location.search
      if (window.location.search.indexOf('state') === -1) {
        // Append state query param to URI for later.
        // state query param will be used to look up
        // token response upon page reload.

        queryParam += (window.location.search ? '&' : '?')
        queryParam += 'state=' + params.state

        var url = window.location.protocol + '//' +
                               window.location.host +
                               window.location.pathname +
                               queryParam

        window.history.pushState({}, '', url)
      }
    }

    var data = {
      code: params.code,
      grant_type: 'authorization_code',
      redirect_uri: state.client.redirect_uri
    }

    return new Promise(function (resolve, reject) {
      let xhr = new XMLHttpRequest()
      xhr.open('POST', state.provider.oauth2.token_uri)
      if (state.client.secret) xhr.setRequestHeader('Authorization', 'Basic ' + btoa(state.client.client_id + ':' + state.client.secret))
      else data['client_id'] = state.client.client_id
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) resolve(Util.extend(JSON.parse(xhr.response), params))
        else {
          reject(new Error({
            status: this.status,
            statusText: xhr.statusText
          }))
        }
      }
      xhr.onerror = function () {
        reject(new Error({
          status: this.status,
          statusText: xhr.statusText
        }))
      }
      xhr.send(Util.toURLEncoded(data))
    })
  }
}

export default new Flow()
