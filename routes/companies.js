"use strict";

const { NotFoundError, ExpressError, BadRequestError } = require("../expressError");
const express = require("express");
const db = require("../db");

const router = new express.Router();

/** Returns a list of companies {companies: [{code, name}, ...]} */
router.get("/", async function (req, res) {
  const result = await db.query(
    `SELECT code, name, description
          FROM companies`
  );
  const companies = result.rows;
  return res.json({ companies });
});

/** Returns obj of company {company: {code, name, description}} */

router.get("/:code", async function (req, res) {
  const code = req.params.code;
  const result = await db.query(
    `SELECT code, name, description
          FROM companies
          WHERE code = $1`, [code]
  );
  const company = result.rows[0];
  return res.json({ company });
});

/**
 * Adds a company
 * receives JSON like: {code, name, description}
 * returns obj of new company: {company: {code, name, description}}
*/

router.post("/", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();
  const { code, name, description } = req.body;
  const result = await db.query(
    `INSERT INTO companies (code, name, description)
          VALUES ($1, $2, $3)
          RETURNING code, name, description`,
    [code, name, description]);
  const company = result.rows[0];

  return res.status(201).json({ company });
});

/**
 * Edit exisiting company
 * Returns 404 if company cannot be found
 * Receives JSON like: {name, description}
 * Returns updated company object: {company: {code, name, description}}
 */

router.put("/:code", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();
  const { name, description } = req.body;

  const result = await db.query(
    `UPDATE companies
            SET name=$1,
                description=$2
            WHERE code=$3
            RETURNING name, description, code`,
    [name, description, req.params.code],
  );

  const company = result.rows[0];
  if (!company) throw new NotFoundError(`Not found: ${req.params.code}`);
  return res.json({ company });
});

/**
 * Deletes company
 * Returns 404 if company cannot be found
 * Returns {status: "deleted"}
*/

router.delete("/:code", async function (req, res) {
  const result = await db.query(
    `DELETE FROM companies
            WHERE code = $1
            RETURNING code`,
    [req.params.code],
  );

  const company = result.rows[0];

  if (!company) throw new NotFoundError(`Not found: ${req.params.code}`);
  return res.json({ message: "Deleted" });
});


module.exports = router;