const axios = require('axios')
const sgMail = require('@sendgrid/mail')
const CronJob = require('cron').CronJob
const {SG_KEY, OPEN_WEATHER_KEY, FROM, TO} = require('./credentials')

var nodeMailer = require('nodemailer');
const mongoose = require('mongoose')
mongoose.connect("mongodb://localhost:27017/weatherDB", {useNewUrlParser: true});

const weatherSchema = {
    email: String,
    name: String,
    location: String,
    days:[String]
}

const Weather = mongoose.model("Weather",weatherSchema);


sgMail.setApiKey(SG_KEY);

// const cronJob = new CronJob('* * * * * *', run);
// cronJob.start();

async function run() {
    try {
        await Weather.find(function(err,weather){
            if(err){
                console.log(err);
            } else {
                console.log(weather);
                let weatherData1;
                let weatherData2;

                weather.forEach(function (weatherItem) { 
                    const mailId = weatherItem.email;
                    const userName = weatherItem.name;
                    const userLocation = weatherItem.location;
                    const day = weatherItem.days; 
                    console.log(mailId);

                    const weatherData =  getWeatherData(userLocation);
                    const forecastInfo1 =  getforecastData(userLocation,0);
                    const forecastInfo2 =  getforecastData(userLocation,1);
                    
                    const date = new Date();
                    let d = date.getDay();
                    const yyyy = date.getFullYear();

                    let mm = date.getMonth() + 1;
                    let dd = date.getDate();
                    if (dd < 10) dd = '0' + dd;
                    if (mm < 10) mm = '0' + mm;
                    const fullDate = dd + '/' + mm + '/' + yyyy;

                    let today;
                    if(d==0) today='Sunday'
                    else if(d==1) today='Monday'
                    else if(d==2) today='Tuesday'
                    else if(d==3) today='Wednesday'
                    else if(d==4) today='Thursday'
                    else if(d==5) today='Friday'
                    else today='Saturday'
                    
                    if(!day.includes(today)){
                    forecastInfo1.then(function(result){
                        weatherData1 = result;
                        forecastInfo2.then(function(result){
                            weatherData2 = result;
                            console.log(weatherData1);
                            console.log(weatherData2);
                            console.log(userName);
                            let transporter = nodeMailer.createTransport({
                                host: "smtp.gmail.com",
                                port: 465,
                                secure: true,
                                auth: {
                                  user: "dummyforproject19@gmail.com",
                                  pass: "ilrqkumtuvokdhba",
                                },
                              });
            
                              let mailOptions = {
                                from: '"Weather Alerts" <nishisuratia9102@gmail.com>', // sender address
                                to: mailId, // list of receivers
                                subject: "Weather Alert", // Subject line
                                text: "Weather Alert for you", // plain text body
                                html: `<p>Hello_${userName}, your weather alert for _today (${fullDate}) is here!</p>
                                <p>Maximum Temprature: ${weatherData1.temp_max}°C</p>
                                <p>Minimum Temprature: ${weatherData1.temp_min}°C</p>
                                <p>Temprature: ${weatherData1.tempf}°C</p>
                                <p>Weather Looks like: ${weatherData1.weather_main}</p>
                                <p>Wind Speed: ${weatherData1.speed*3.6} km/hr </p>
                                ${weatherData1.weather_main=='Rain'?`<p>It's ${weatherData1.weather_des} out there, please carry an umbrella with you and be safe!
                                </p>`:`<p>It's ${weatherData1.weather_des} out there</p>`}
                                
                                <br>
                                <p>Your weather alert for _tommorow is here!</p>
                                <p>Maximum Temprature: ${weatherData2.temp_max}°C</p>
                                <p>Minimum Temprature: ${weatherData2.temp_min}°C</p>
                                <p>Temprature: ${weatherData2.tempf}°C</p>
                                <p>Weather Looks like: ${weatherData2.weather_main}</p>
                                <p>Wind Speed: ${weatherData2.speed*3.6} km/hr</p>
                                ${weatherData2.weather_main=='Rain'?`<p>It's ${weatherData2.weather_des} out there, please carry an umbrella with you and be safe!
                                </p>`:`<p>It's ${weatherData2.weather_des} out there</p>`}
                                <br>
                                <p>Thank you for subscribing with us!</p>`, 
                              };
                            
                              transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                  return console.log(error);
                                }
                                console.log("Message sent");
                              });
                        })
                    })
                    }  
                })
            }
        })}
        catch(e){
            console.log(e);
        }    
}
function getWeatherData(city) {
    return axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPEN_WEATHER_KEY}&units=metric`)
    .then(result => {
        return {
            weather_id: result.data.weather[0].id + '',
            temp: result.data.main.temp,
            weather_main: result.data.weather[0].main
            
        };
    });
}
function getforecastData(city,k) {
    return axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPEN_WEATHER_KEY}&units=metric`)
    .then(result => {
        return {
            date: result.data.list[k].dt_txt,
            tempf: result.data.list[k].main.temp,
            weather_main: result.data.list[k].weather[0].main,
            weather_des: result.data.list[k].weather[0].description,
            speed: result.data.list[k].wind.speed,
            temp_min: result.data.list[k].main.temp_min,
            temp_max: result.data.list[k].main.temp_max
        };
    });
}

// run()
