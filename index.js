const querystring = require('querystring');
const https = require('https')

const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB.DocumentClient();

const weatherApiKey = '04f2080170dbbc8d66117e8848a54766'
const coordinates = 'lat=-33.9998489&lon=18.4734093'
const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?${coordinates}&appid=${weatherApiKey}&units=metric`

// AWS.config.update({ region: 'af-south-1' });

/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
 */
exports.handler = async (event, context) => {
    let body;
    let statusCode = '200';

    const headers = {
        // 'Content-Type': 'application/json',
        'Content-Type': 'text/plain'
    };

    // --
    // Respond to request
    // Check if it's a browser instead of a twilio whatsapp message
    // if (event.headers['Content-Type'] && event.headers['Content-Type'].includes('text/html')) {
    if (event.headers['User-Agent'] && !event.headers['User-Agent'].includes('Twilio')) {
        return {
            statusCode: '200',
            body: JSON.stringify(await dynamo.scan({ TableName: 'SandboxWhatsappMessages' }).promise()),
            // body: 'hi browser',
            // body: await fetch(weatherUrl),
            // body: await fetch('https://www.google.co.za'),
            headers: {
                'Content-Type': 'application/json'
                // 'Content-Type': 'text/html'
            }
        }
    }

    try {
        // body = await dynamo.delete(JSON.parse(event.body)).promise();
        // body = await dynamo.scan({ TableName: event.queryStringParameters.TableName }).promise();
        // body = await dynamo.put(JSON.parse(event.body)).promise();
        // body = await dynamo.update(JSON.parse(event.body)).promise();

        const requestBody = querystring.parse(event.body)

        const message = requestBody.Body
        const from = requestBody.From

        await dynamo.put({
            TableName: 'SandboxWhatsappMessages',
            Item: {
                id: Date.now().toString(),
                message,
                from
            }
        }).promise()

        console.log('message:', message)
        console.log('from:', from)

        body = await generateMessageResponse(message, from)
    }
    catch (err) {
        statusCode = '400';
        body = err.message;
    }

    return {
        statusCode,
        body,
        headers,
    };
};

async function generateMessageResponse(message, from) {
    if (message.includes('weather')) return getWeather()
    else if (message.includes('google')) return 'shutcho ass up about google'
    else if (message.match(/\b(shutt? ?up)|(shuddup)\b/i)) return 'naww you shut up'
    else if (message.match(/\b(yikes)|(eish)|(oof)\b/i)) return 'yup 😗 \n (that aint a kissing emoji)'
    else if (message.match(/\b(stand( |-)?ups?)\b/i)) return getStandups()
    else if (message.match(/\bgn\b/i) || message.match(/\bni(gh)?te?\b/) || message.includes('say it back')) return 'gn 😔😘'
    else if (message.match(/\bsay sike\b/i)) return 'sike lol'
    else if (message.match(/\lol/i)) return 'lol'
    else if (message.match(/\bbro\b/)) return 'dont call me bro'
    else return 'That\'s cool bro'
}

function getStandups() {
    return `Max's Standups: ${dayNumberToName(new Date().getDay())} ${new Date().toLocaleDateString()}:
**today**
- do more UPL stuff
- admin probably
- discuss some biz stuff @shai
- some WMM stuff

**yesterday**
- wrote some good code 😃
- wrote some average code 😐
- wrote some bad code 😟
- wrote some emails 😞

**blockers**
- none that I can think of :)`
}

function dayNumberToName(dayNumber) {
    return Array.from(['Sunday (it\'s a day of rest!)', 'Monday', 'Toozday', 'Wednesday', 'Thurzday', 'Friday :)', 'Saturday (why you looking at my standups on a saturday lol??)'])[dayNumber]
}

async function getWeather() {
    const weather = JSON.parse(await fetch(weatherUrl))
    
    console.log(weather)
    
    
    const description = weather.weather[0].description
    const temperature = weather.main.temp
    
    
    let remark = 'FUCK! That\'s fucking ExTrEmE'
    
    if (temperature > 30) remark = 'That\'s fucking hot!'
    else if (temperature > 25) remark = 'Oooh it feel like Summer'
    else if (temperature > 20) remark = 'That\'s some pretty boring ass weather tbh'
    else if (temperature > 15) remark = 'Erm kinda chilly I guess. But not that much. Or whatever'
    else if (temperature > 10) remark = 'Yaa shawty thats DAMN COLD'
    else if (temperature > 5) remark = 'FUCK! That\'s FUCKING freezing.'
    else if (temperature > 0) remark = 'Either this shit is broken or global warming really a hoax.'
    

    return `The weather rn in Kenilworth is ${description} vibes and the temp is ${temperature} ° C. ${remark}`

}

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
          res.setEncoding("utf8");
          
          let body = "";
          res.on("data", data => {
            body += data;
          });
          res.on("end", () => {
            resolve(body)
            // console.log(body);
          });
        });

   })
}

