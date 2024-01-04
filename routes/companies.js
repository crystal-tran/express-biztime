const { ExpressError } = require("../expressError");
const express = require("express");
const router = new express.Router();
const db = require("../db");

// routes go here

/** Returns a list of companies {companies: [{code, name}, ...]} */
router.get("/", async function(req, res){
  const result = await db.query(
    `SELECT code, name, description
          FROM companies`
  );
  const companies = result.rows;
  return res.json({ companies });
})

/** Returns obj of company {company: {code, name, description}} */

router.get("/:code", async function(req, res){
  const code = req.params.code;
  const result = await db.query(
    `SELECT code, name, description
          FROM companies
          WHERE code = $1`, [code]
  );
  const company = result.rows[0]
  return res.json({ company });
});


module.exports = router;