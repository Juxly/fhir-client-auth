class Util {
  getParam (p) {
    let query = location.search.substr(1)
    let data = query.split('&')
    let result = []

    for (var i = 0; i < data.length; i++) {
      let item = data[i].split('=')
      if (item[0] === p) {
        let res = item[1].replace(/\+/g, '%20')
        result.push(decodeURIComponent(res))
      }
    }
    if (result.length) return result[0]
  }

  extend (a, b) {
    for (var key in b) if (b.hasOwnProperty(key)) a[key] = b[key]
    return a
  }
}

export default new Util()
