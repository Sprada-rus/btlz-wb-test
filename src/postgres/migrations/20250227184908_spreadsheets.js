/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("stocks_coefs", (table) => {
        table.bigInteger("stock_id").primary();
        table.date("date");
        table.string("house_name");
        table.float("delivery_base");
        table.float("delivery_coef_expr");
        table.float("delivery_liter");
        table.float("market_base");
        table.float("market_coef_expr");
        table.float("market_liter");
        table.float("storage_base");
        table.float("storage_coef_expr");
        table.float("storage_liter");
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("stocks_coefs");
}
