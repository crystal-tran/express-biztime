const { ExpressError } = require("../expressError");
const express = require("express");
const router = new express.Router();
const db = require("../db");

// routes go here
/**Returns a list of companies */
router.get("/", async function(req, res){
  const result = await db.query(
    `SELECT code, name, description
          FROM companies`
  );
  const companies = result.rows;
  return res.json({ companies });
})


module.exports = router;