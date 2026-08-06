-- Servicios
INSERT INTO services (slug, nombre, descripcion, duracion_min, precio_cents, activo, orden) VALUES
('acompanamiento', 'Acompañamiento', 'Sesión individual de acompañamiento y terapia. Un espacio seguro para explorar, sanar y crecer.', 60, NULL, 1, 1),
('adultos', 'Tameana para adultos', 'Sesiones individuales de Tameana para reconectar con tu energía vital y liberar bloqueos emocionales.', 60, NULL, 1, 2),
('ninos', 'Tameana para niños', 'Adaptación suave de la técnica para los más pequeños. Ayuda a equilibrar su energía de forma lúdica y respetuosa.', 45, NULL, 1, 3),
('espacios', 'Tameana para espacios', 'Limpieza y armonización energética de hogares, consultas y lugares de trabajo.', 90, NULL, 1, 4),
('grupal', 'Tameana grupal', 'Sesiones en grupo donde la energía colectiva potencia el trabajo individual de cada participante.', 90, NULL, 1, 5),
('animales', 'Tameana para animales', 'Los animales también se benefician de la armonización energética. Sesiones para mascotas y otros animales.', 45, NULL, 1, 6);

-- Disponibilidad semanal: L-V 10:00-14:00 y 16:00-19:00
INSERT INTO availability_rules (dia_semana, hora_inicio, hora_fin) VALUES
(1, '10:00', '14:00'),
(1, '16:00', '19:00'),
(2, '10:00', '14:00'),
(2, '16:00', '19:00'),
(3, '10:00', '14:00'),
(3, '16:00', '19:00'),
(4, '10:00', '14:00'),
(4, '16:00', '19:00'),
(5, '10:00', '14:00'),
(5, '16:00', '19:00');
