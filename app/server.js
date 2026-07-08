import express from "express"
import countries from "../json/middle_east.json" with { type: 'json' }
const app= express()
const port= 3000
const defaultPath= "/countries"

app.use(express.json())

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});


app.get("/countries", (req, res) => {
    res.send(countries)
})

app.get("/countries/:name", (req, res) => {
    const name= req.params.name.toLocaleLowerCase()
    const country= countries.find(c => c.name.toLocaleLowerCase()=== name)
    if (!country){
        return res.status(404).json({
            error: "Country not found"
        })
    }
    res.send(country)
})

app.post("/countries", (req, res) => {
    countries.push(req.body)
    res.status(201).json(req.body)
})

app.listen(port, () => {
    console.log("Showing middle east countries")
})

