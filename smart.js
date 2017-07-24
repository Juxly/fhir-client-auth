class Smart {
  constructor (p) {
    this.userId = p.userId
    if (p.patientId) {
      this.patient = {}
      this.patient.id = p.patientId
    }
    this.user = {
      'read': function () {
        var userId = this.userId
        var resource = userId.split('/')[0]
        var uid = userId.split('/')[1]
        return this.get({
          resource: resource,
          id: uid
        })
      }
    }

    var server = this.server = {
      serviceUrl: p.serviceUrl,
      auth: p.auth || {
        type: 'none'
      }
    }
    server.auth = server.auth || {
      type: 'none'
    }
    if (!this.server.serviceUrl || !this.server.serviceUrl.match(/https?:\/\/.+[^/]$/)) {
      throw new Error('Must supply a `server` property whose `serviceUrl` begins with http(s) ' +
        'and does NOT include a trailing slash. E.g. `https://fhir.aws.af.cm/fhir`')
    }
  }
}

export default Smart
