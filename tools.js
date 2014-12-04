var tools = {
  isString: function (obj) {
    return typeof(obj) === typeof('known string')
  },
  isRegExp: function(obj) { 
    return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false)); 
  }
}
module.exports = tools