CREATE TABLE IF NOT EXISTS plot_vehicle_rate (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plot_id INT NOT NULL,
  vehicle_type_id TINYINT NOT NULL,
  rate_per_hour DECIMAL(10,2) NOT NULL DEFAULT 0,
  minimum_hours DECIMAL(10,2) NOT NULL DEFAULT 1,
  extend_rate_per_hour DECIMAL(10,2) NULL,
  created_uid INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_uid INT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_uid INT NULL,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_plot_vehicle_rate (plot_id, vehicle_type_id)
);
