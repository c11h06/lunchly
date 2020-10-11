/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  //searching customer by first name

  static async findCustomer(name) {
    try {
      name = name[0].toUpperCase() + name.slice(1).toLowerCase();
      const result = await db.query(
        `SELECT id,
        first_name AS "firstName", 
        last_name AS "lastName",
        phone,
        notes
        FROM customers
        WHERE first_name = $1
    `, [name]);
      
      const customers = result.rows;
        
      if (customers[0] === undefined) {
        const err = new Error(`No such customer: ${name}`);
        err.status = 400;
        throw err;
      }
      
      return customers.map(customer => new Customer(customer));
    } catch (err) {
      next(err);
    }
  }

  static async findBestCustomers() {
    try{
    const result = await db.query(`
      SELECT customers.id, first_name "firstName", last_name "lastName", customers.phone, customers.notes, COUNT('*') 
      FROM customers 
      JOIN reservations
      ON customers.id = reservations.customer_id
      GROUP BY customers.id, last_name, first_name
      ORDER BY count DESC
      LIMIT 10;
    `)
    const customers = result.rows;

    if (customers[0] === undefined) {
      const err = new Error(`No such customer: ${name}`);
      err.status = 400;
      throw err;
    }

    return customers.map(customer => new Customer(customer));
  } catch(err) {
    next(err);
  }
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }
  
  fullName() {
    return `${this.firstName} ${this.lastName}`
  }


}

module.exports = Customer;
