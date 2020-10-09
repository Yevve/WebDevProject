const express = require('express')
const expressHandlebars = require('express-handlebars')
const app = express()
app.engine(".hbs",expressHandlebars({
    defaultLayout:"main.hbs"
}))

app.use(express.static("static"))
app.get("/layout.css")

app.get("/",function(request,response){
response.render("start.hbs")
})

app.get("/about",function(request,response){
    response.render("about.hbs")
})
app.get("/contact",function(request,response){
    response.render("contact.hbs")
})

app.listen(8080)

