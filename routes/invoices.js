"use strict";

const { NotFoundError, BadRequestError } = require("../expressError");
const express = require("express");
const db = require("../db");

const router = new express.Router();


/** Return info on invoices: {invoices: [{id, comp_code}, ...]} */

router.get("/", async function (req, res) {
  const result = await db.query(
    `SELECT id, comp_code
          FROM invoices
          ORDER BY id`
  );
  const invoices = result.rows;
  return res.json({ invoices });
});


/**
 * Returns obj of on given invoice id:
 * {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
 * Throws 404 error if company not found
 */

router.get("/:id", async function (req, res) {
  const id = req.params.id;

  const result = await db.query(
    `SELECT i.id,
            i.amt,
            i.paid,
            i.add_date,
            i.paid_date,
            i.comp_code,
            c.name,
            c.description
          FROM invoices AS i
            JOIN companies AS c
              ON i.comp_code = c.code
          WHERE id = $1`, [id]);
  const companyInvoiceInfo = result.rows[0];

  if (!companyInvoiceInfo) throw new NotFoundError(`Invoice not found: ${req.params.id}`);

  const invoice = {
    id: companyInvoiceInfo.id,
    amt: companyInvoiceInfo.amt,
    paid: companyInvoiceInfo.paid,
    add_date: companyInvoiceInfo.add_date,
    paid_date: companyInvoiceInfo.paid_date,
    company: {
      code: companyInvoiceInfo.comp_code,
      name: companyInvoiceInfo.name,
      description: companyInvoiceInfo.description
    }
  };

  return res.json({ invoice });
});


/**
 * Adds an invoice
 * receives JSON like: {comp_code, amt}
 * returns obj of new invoice:
 * {{invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.post("/", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();
  const { comp_code, amt } = req.body;

  const result = await db.query(
    `INSERT INTO invoices (comp_code, amt)
          VALUES ($1, $2)
          RETURNING id,
                    comp_code,
                    amt,
                    paid,
                    add_date,
                    paid_date`,
    [comp_code, amt]);
  const invoice = result.rows[0];

  return res.status(201).json({ invoice });
});



/**
 * Updates existing invoice
 * Receives JSON like: {amt}
 * Throws 404 if company cannot be found
 * Returns updated invoice object:
 * {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

router.put("/:id", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const { amt } = req.body;
  const id = req.params.id;

  const result = await db.query(
    `UPDATE invoices
            SET amt=$1
            WHERE id=$2
            RETURNING id,
                      comp_code,
                      amt,
                      paid,
                      add_date,
                      paid_date`,
    [amt, id],
  );

  const invoice = result.rows[0];

  if (!invoice) throw new NotFoundError(`Not found: ${req.params.id}`);
  return res.json({ invoice });
});


/**
 * Deletes invoice
 * Throws 404 if invoice cannot be found
 * Returns {status: "deleted"}
*/

router.delete("/:id", async function (req, res) {
  const id = req.params.id;
  const result = await db.query(
    `DELETE FROM invoices
            WHERE id = $1
            RETURNING id`,
    [id],
  );
  const deletedInvoice = result.rows[0];

  if (!deletedInvoice) throw new NotFoundError(`Invoice not found: ${id}`);
  return res.json({ message: "Deleted" });
});


module.exports = router;

//TODO: on the put and insert route. If someone sends you bad data with a null field
// Its going to be a gross db error
// Implement try catch for null fields

