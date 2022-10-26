import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connection } from "./server/database";
import { cakeSchema, newClientSchema } from "./middlewares/schemas";
dotenv.config();

const server = express();
server.use(express.json());
server.use(cors());

server.post("/cakes", async function (req, res) {
	const validation = cakeSchema.validate(req.body, {
		abortEarly: false,
	});
	if (validation.error) {
		validation.error.details.map((error) => error.message);
		return res.sendStatus(422);
	}
	const { name, price, image, description } = req.body;

	try {
		if (!name || !price || !description) {
			return res.sendStatus(400);
		}
		if (!image) {
			return res.sendStatus(422);
		}
		const consult = await connection.query(
			`
			SELECT * FROM cakes WHERE name = $1 ;
			`,
			[name]
		);
		if (consult) {
			return res.sendStatus(409);
		}

		return connection.query(
			`
			INSERT INTO cakes 
			(name, price, image, description) 
			VALUES ($1, $2, $3, $4) ;
		`,
			[name, price, image, description]
		);
	} catch (error) {
		console.error(error);
	}
});

server.post("/clients", async function (req, res) {
	const { name, address, phone } = req.body;

	if (!name || !address || !phone) {
		return res.sendStatus(400);
	}
	const validation = newClientSchema.validate(req.body, {
		abortEarly: false,
	});
	if (validation.error) {
		validation.error.details.map((error) => error.message);
		return res.sendStatus(422);
	}

	try {
		await connection.query(
			`
			INSERT INTO clients (name, address, phone)
			VALUES ($1, $2, $3) ;
		`,
			[name, address, phone]
		);

		return res.sendStatus(201);
	} catch (error) {
		console.error(error);
	}
});

server.post("/order", async function (req, res) {
	const { clientId, cakeId, quantity } = req.body;

	if (!clientId || !cakeId) {
		return res.sendStatus(404);
	}
	if (quantity < 0 || quantity > 5) {
		return res.sendStatus(400);
	}

	try {
		const client = await connection.query(
			`
			SELECT id FROM clients WHERE id = $1 ;
		`,
			[clientId]
		);
		if (!client) {
			return res.sendStatus(404);
		}

		const cake = await connection.query(
			`
			SELECT id FROM cakes WHERE id = $1 ;
		`,
			[cakeId]
		);
		if (!cake) {
			return res.sendStatus(404);
		}

		return connection.query(
			`
			INSERT INTO orders (clientId, cakeId, quantity, createdAt, totalPrice)
			VALUES ($1, $2, $3, NOW, $4)
		`,
			[clientId, cakeId, quantity, cake.price * quantity]
		);
	} catch (error) {
		console.error(error);
	}
});

server.get("/orders/?:date", async function (req, res) {
	const date = req.params;

	try {
		if (date) {
			const query = await connection.query(
				`
			SELECT clients.* cakes.* orders."createdAt" orders.quantity orders."totalPrice" 
			FROM orders 
			JOIN clients ON orders."clientId" = clients.id
			JOIN cakes ON orders."cakeId" = cakes.id 
			WHERE orders."createdAt" = $1 ;
		`,
				[date]
			);
			return res.send(query.rows).statusCode(200);
		}
		const query = await connection.query(`
			SELECT clients.* cakes.* orders."createdAt" orders.quantity orders."totalPrice" 
			FROM orders 
			JOIN clients ON orders."clientId" = clients.id
			JOIN cakes ON orders."cakeId" = cakes.id ;
		`);
		if (!query) {
			return res.send([]).statusCode(404);
		}
		res.send(query.rows).statusCode(200);
	} catch (error) {
		console.error(error);
	}
});

server.get("/orders/:id", async function (req, res) {
	const id = req.params;
	try {
		const query = await connection.query(
			`
			SELECT clients.* cakes.* orders."createdAt" orders.quantity orders."totalPrice" 
			FROM orders 
			JOIN clients ON orders."clientId" = clients.id
			JOIN cakes ON orders."cakeId" = cakes.id 
			WHERE orders.id = $1 ;
		`,
			[id]
		);

		if (!query) {
			return res.sendStatus(404);
		}

		res.send(query.rows).status(200);
	} catch (error) {
		console.error(error);
	}
});

server.get("/clients/:id/orders", async function (req, res) {
	const id = req.params;

	try {
		const query = await connection.query(
			`
			SELECT cakes.name orders.* 
			FROM orders 
			JOIN cakes.name ON orders."cakeId" = cakes.id 
			WHERE orders."clients.id" = $1 ;
		`,
			[id]
		);
		if (!query) {
			return res.sendStatus(404);
		}
		res.send(query.row).status(200);
	} catch (error) {
		console.error(error);
	}
});

server.get("/status", async function (req, res) {
	res.sendStatus(200).json({
		status: "ok",
	});
});

server.listen(process.env.PORT, () => {
	console.log(`Server is running on port ${process.env.PORT}`);
});
