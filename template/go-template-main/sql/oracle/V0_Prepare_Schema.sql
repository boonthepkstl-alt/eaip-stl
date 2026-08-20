CREATE SMALLFILE TABLESPACE "HR_DATA" DATAFILE
'/tmp/hr.dbf'
SIZE 100M AUTOEXTEND ON NEXT 100M MAXSIZE 8G
LOGGING DEFAULT NOCOMPRESS ONLINE
EXTENT MANAGEMENT LOCAL AUTOALLOCATE
SEGMENT SPACE MANAGEMENT AUTO;

CREATE TEMPORARY TABLESPACE "HR_DATA_TEMP" TEMPFILE '/tmp/hr_tmp.dbf' SIZE 500m autoextend on next 10m maxsize unlimited;


CREATE USER hr IDENTIFIED BY hr DEFAULT TABLESPACE HR_DATA TEMPORARY TABLESPACE HR_DATA_TEMP;
grant resource,connect to hr;
grant create view to hr;
grant create table to hr;
grant create sequence to hr;
grant create procedure to hr;
ALTER USER hr QUOTA 100M ON HR_DATA;
GRANT UNLIMITED TABLESPACE TO hr;

-- ── Application user ──────────────────────────────────────────────────────────
CREATE USER appuser IDENTIFIED BY apppassword
    DEFAULT TABLESPACE USERS
    QUOTA UNLIMITED ON USERS;

GRANT CONNECT, RESOURCE TO appuser;

