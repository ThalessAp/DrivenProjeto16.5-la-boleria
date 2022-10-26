import joi from "joi";

const cakeSchema = joi.object({
	name: joi.string().min(2).required(),
	price: joi.number().min(1).required(),
	image: joi.string().uri().required(),
	description: joi.string(),
});

const newClientSchema = joi.object({
  name: joi.string().required(),
  address: joi.string().required(),
  phone: joi.string().min(10).max(11).required(),
})

const newOrderSchema = joi.object({
  clientId: joi.number().required(),
  cakeId: joi.number().required(),
  quantity: joi.number().min(1).max(5).required(),
})

export {cakeSchema, newClientSchema, newOrderSchema};