import Util from './util'

class Token {
  refresh (state) {
    const data = { 'grant_type': 'refresh_token', 'refresh_token': state.tokenResponse.refresh_token }
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest()
      xhr.open('POST', state.provider.oauth2.token_uri)
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
      xhr.setRequestHeader('Accept', 'application/json')
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          var oldState = state.tokenResponse.state
          var oldCode = state.tokenResponse.code
          var refreshToken = state.tokenResponse.refresh_token
          var newToken = JSON.parse(xhr.response)
          newToken.state = oldState
          newToken.code = oldCode
          newToken.refresh_token = refreshToken
          resolve(newToken)
        } else reject(Util.toXHRError(this))
      }
      xhr.onerror = function () {
        reject(new Error('Refresh Token failed'))
      }
      xhr.send(Util.toURLEncoded(data))
    })
  }
}

export default new Token()
