var fs = require('fs')
var path = require('path')
var util = require('util')
var lodash = require('lodash')

module.exports = function posthtmlStyleToFile(options) {
  var buf = ''

  return function (tree) {
    const sourcePath = path.resolve(options.src)
    const destPath = path.resolve(options.dest)

    let relativeFile = tree.options.from.substring(tree.options.from.length, sourcePath.length)

    // relativeFile = path.basename(relativeFile, path.extname(relativeFile))
    let pos = relativeFile.lastIndexOf('.')

    relativeFile = relativeFile.substr(0, pos < 0 ? relativeFile.length : pos)


    let destFile = path.join(destPath, relativeFile) + '.css'

    tree.match({tag: 'style', attrs: {type: 'text/scss'}}, function (node) {
      buf += node.content[0].trim() || ''

      return ''
    })

    if (buf) {
      if (options.sass) {
        const sass = require('dart-sass')
        options.sass.data = buf

        if (options.sass.sourceMap) {
          options.sass.outFile = destFile
        }
        const result = sass.renderSync(options.sass)

        writeContentToFile(result.css.toString(), destFile)

        if (options.sass.sourceMap) {
          writeContentToFile(JSON.stringify(result.map), destFile + '.map')
        }

        console.log('#########')
        console.log(relativeFile)
        if (options.cssLink) {
          let cssLink = lodash.cloneDeep(options.cssLink)
          cssLink.attrs.href = util.format(options.cssLink.attrs.href, relativeFile)
          if (cssLink.attrs.identifier) {
            cssLink.attrs.identifier = util.format(options.cssLink.attrs.identifier, relativeFile)
          }

          tree.match({tag: 'html'}, function (node) {
            node.content.unshift(cssLink)
            node.content.unshift('\n')
            return node
          })
        }
      } else {
        destFile = destFile.substr(0, pos < 0 ? destFile.length : pos) + '.scss'
        writeContentToFile(buf, destFile)
      }
    }

    return tree
  }

  function writeContentToFile(data, file) {
    if (!fs.existsSync(path.dirname(file))) {
      fs.mkdirSync(path.dirname(file), {
        recursive: true,
      })
    }
    fs.writeFileSync(path.resolve(file), data, 'utf-8', function (error) {
      if (error) throw error
    })
  }
}
