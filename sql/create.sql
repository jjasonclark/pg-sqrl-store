-- No fields are meant to be changed after creation
CREATE TABLE IF NOT EXISTS users(
  id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  -- When created
  created TIMESTAMP DEFAULT NOW()
);

-- Holds a SQRL identity
-- After creation only the disabled and superseded fields should change
CREATE TABLE IF NOT EXISTS sqrl(
  -- all sqrls belong to a user
  user_id INT NOT NULL REFERENCES users(id),
  -- idk, suk, and vuk are all 256 bit values
  -- Postgres does not index bytea data types
  -- therefore using base64url encoded values
  idk CHAR(43) PRIMARY KEY,
  suk CHAR(43),
  vuk CHAR(43),
  -- When created
  created TIMESTAMP DEFAULT NOW(),
  -- (mutable) when disabled last
  disabled TIMESTAMP,
  -- (mutable if null) when superseded last
  superseded TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nuts(
  id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  -- Initial nut in the nut chain
  initial INT REFERENCES nuts(id),
  ip INET NOT NULL,
  hmac CHAR(43),
  -- ask question and choices
  ask VARCHAR(2048),
  -- limit use to known user
  user_id INT REFERENCES users(id),
  -- When nut was created
  created TIMESTAMP DEFAULT NOW(),
  -- (mutable if null) this nut has been used by this idk
  idk CHAR(43),
  -- (mutable if null) user completed successful authentication
  identified TIMESTAMP,
  -- (mutable if null) User issued credentials
  issued TIMESTAMP
);
