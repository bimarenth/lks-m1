const express    = require('express'),
    app          = express(),
    cors         = require('cors'),
    compression  = require('compression'),
    helmet       = require('helmet'),
    cookieParser = require('cookie-parser'),
    env          = require('./env'),
    fs           = require("fs"),
    https        = require('https'),
    port         = env.port || 8000

// environments
app.use(helmet())
app.use(compression())
app.disable("x-powered-by")
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.raw())
app.use('/public', express.static(__dirname + '/public')) // Public directory

/* Dynamic CORS */
/* Disable CORS
const whitelist = [`${env.client_host}`,`${env.client_host_prod}`]

const options = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback("CORS Not allowed by SERVER API'S", false)
        }
    },
    credentials: true
}
app.use(cors(options)) 
*/
/* End Dynamic CORS */

/* Start Cookie Settings */
app.use(cookieParser())
/* End Cookie Settings */

/* Start of Routing Modules */
const studentRoute   = require('./routes/studentRoute')

studentRoute(app)
/* End of Routing Modules */

/* Start Database Connection Check */
let conn
if (env.db_type === 'mongodb') {
    conn = require('./config/database/mongoose')
} else {
    const { dbConn } = require('./config/database/sequelize')
    conn = dbConn
}

if(conn) {
    if (env.node_env === 'production') {
        try {
            const privateKey  = fs.readFileSync(`${env.httpsPrivateKey}`, 'utf8')
            const certificate = fs.readFileSync(`${env.httpsCertificate}`, 'utf8')
            const credentials = {key: privateKey, cert: certificate}
            const httpsApps   = https.createServer(credentials, app)
    
            httpsApps.listen(port, () => console.log(`Server API listen on ${env.host}:${env.port}`))
        } catch (error) {
            console.log(new Error(error))
        }
    } else {
        app.listen(port, () => console.log(`Server API listen on ${env.host}:${env.port}`))
    }
} else {
    console.log(`${env.host}:${env.port} cannot connect to the Database ${env.db_type}!`)
}
/* End Database Connection Check */