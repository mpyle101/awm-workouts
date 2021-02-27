INSERT INTO awm.user (username, password, email, first_name, last_name)
VALUES (
    ${username},
    crypt(${password}, gen_salt('bf', 8)),
    ${email},
    ${first_name},
    ${last_name}
)
RETURNING id