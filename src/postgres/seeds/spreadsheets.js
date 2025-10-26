import { getCurrentDate } from "#utils/common.js";

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    await knex("stocks_coefs")
        .insert([{ stock_id: 1, date: (getCurrentDate()), house_name: 'Цифровой склад',  delivery_base: 46,
            delivery_coef_expr: 100,
            delivery_liter: 14,
            market_base: null,
            market_coef_expr: null,
            market_liter: null,
            storage_base: 0.07,
            storage_coef_expr: 100,
            storage_liter: 0.07 }])
        .onConflict(["stock_id"])
        .ignore();
}
