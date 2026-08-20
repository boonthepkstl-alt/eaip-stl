package model

type SampleModel struct {
	ID      string `db:"id" json:"ID"`
	Column1 string `db:"column1" json:"Column1"`
	Column2 string `db:"column2" json:"Column2"`
}

type PaginationQuery struct {
	Page  int `query:"page"`
	Limit int `query:"limit"`
}

type PaginatedResponse struct {
	Data       []SampleModel `json:"data"`
	Total      int           `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"total_pages"`
}

// MSSQL SQL
var SQL_simple_mssql_get_data = `select ID, Column1 as Column1 ,Column2 as Column2 from samplemodel where id = @id ;`
var SQL_simple_mssql_add = `INSERT INTO samplemodel (id, column1 ,column2) VALUES(@id, @column1, @column2);`
var SQL_simple_mssql_update = `UPDATE samplemodel SET column1 = @column1, column2 = @column2 WHERE id = @id;`
var SQL_simple_mssql_delete = `DELETE FROM samplemodel WHERE id = @id;`
var SQL_simple_mssql_list = `SELECT ID, Column1, Column2 FROM samplemodel ORDER BY id OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;`
var SQL_simple_mssql_count = `SELECT COUNT(*) FROM samplemodel;`

// Tarantool SQL
var SQL_simple_tt_get_data = `select ID, Column1 as Column1 ,Column2 as Column2 from SampleModel where id = ? ;`
var SQL_simple_tt_add = `INSERT INTO SampleModel (Column1 ,Column2)
	VALUES(?, ?);`
var SQL_simple_tt_update = `UPDATE SampleModel SET Column1 = ?, Column2 = ? WHERE ID = ?;`
var SQL_simple_tt_delete = `DELETE FROM SampleModel WHERE ID = ?;`
var SQL_simple_tt_list = `SELECT ID, Column1, Column2 FROM SampleModel ORDER BY ID LIMIT ? OFFSET ?;`
var SQL_simple_tt_count = `SELECT COUNT(*) FROM SampleModel;`

// PostgreSQL SQL
var SQL_simple_pg_get_data = `select ID, Column1 as Column1 ,Column2 as Column2 from samplemodel where id = $1 ;`
var SQL_simple_pg_add = `INSERT INTO samplemodel (ID , Column1 ,Column2)
	VALUES($1, $2, $3);`
var SQL_simple_pg_update = `UPDATE samplemodel SET column1 = $1, column2 = $2 WHERE id = $3;`
var SQL_simple_pg_delete = `DELETE FROM samplemodel WHERE id = $1;`
var SQL_simple_pg_list = `SELECT id, column1, column2 FROM samplemodel ORDER BY id LIMIT $1 OFFSET $2;`
var SQL_simple_pg_count = `SELECT COUNT(*) FROM samplemodel;`

// Oracle SQL
var SQL_simple_oracle_get_data = `SELECT ID AS "id", Column1 AS "column1", Column2 AS "column2" FROM samplemodel WHERE id = :1`
var SQL_simple_oracle_add = `INSERT INTO samplemodel (ID, Column1, Column2) VALUES (:1, :2, :3)`
var SQL_simple_oracle_update = `UPDATE samplemodel SET column1 = :1, column2 = :2 WHERE id = :3`
var SQL_simple_oracle_delete = `DELETE FROM samplemodel WHERE id = :1`
var SQL_simple_oracle_list = `SELECT id AS "id", column1 AS "column1", column2 AS "column2" FROM samplemodel ORDER BY id OFFSET :1 ROWS FETCH NEXT :2 ROWS ONLY`
var SQL_simple_oracle_count = `SELECT COUNT(*) FROM samplemodel`
