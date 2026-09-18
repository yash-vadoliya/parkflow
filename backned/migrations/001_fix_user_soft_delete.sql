-- Bcrypt hashes require at least 60 characters; keep the column safely wide.
ALTER TABLE `user` MODIFY `password` VARCHAR(255) NOT NULL;

-- A new user must not be marked deleted by default.
ALTER TABLE `user`
  MODIFY `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  MODIFY `deleted_uid` INT NULL DEFAULT NULL;

-- Restore users accidentally created as deleted by the old schema.
UPDATE `user` SET `deleted_at` = NULL, `deleted_uid` = NULL WHERE `deleted_at` IS NOT NULL;
