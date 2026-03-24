INSERT INTO usuarios (
  nombre_completo,
  documento,
  email,
  username,
  password_hash,
  id_dependencia,
  id_rol,
  id_cargo,
  id_nivel,
  estado,
  bloqueado,
  id_entidad,
  es_master_admin,
  es_responsable_dependencia
)
VALUES

-- =========================
-- CONTRATISTAS (cargo 21, nivel 2)
-- =========================
('Celso Arevalo',0,'Celso.arevalo211@gmail.com','celsoarevalo','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Daniela Sanchez',0,'danielamsabogada@gmail.com','danielasanchez','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Juan Quintero',0,'mrcamiloquintero@gmail.com','juanquintero','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Yesid Pacheco',0,'Fabianpacheco0729@gmail.com','yesidpacheco','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Edwin Salas',0,'Edwin.salas1980@gmail.com','edwinsalas','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Carlos Castro',0,'Cacaca030197@gmail.com','carloscastro','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Ariel Torres',0,'usaboxgerencia@gmail.com','arieltorres','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Oswaldo Martinez',0,'Oswaldomc24@gmail.com','oswaldomartinez','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Lesli Blanco',0,'inglesliblanco@gmail.com','lesliblanco','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Luis Caviedes',0,'caviedeslozanoluisjavier@gmail.com','luiscaviedes','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Maryuri Lopez',0,'lopezascaniomaryuri@gmail.com','marturilopez','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Maria Fernanda Ramirez',0,'Fernandaramirezq13@gmail.com','mariafernandaramirez','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Alejandra Torres',0,'Alejandratorresmora4@gmail.com','alejandratorres','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Norvey Perez',0,'Norveyperezgil01@gmail.com','norveyperez','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Yivis Mena',0,'yimev@yahoo.es','yivismena','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Alberto Marquez',0,'Albertomarquez1016@hotmail.com','albertomarquez','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Yony Delgado',0,'delgadoangaritayony@gmail.com','yonydelgado','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Cristian Angarita',0,'ingandresangarita28@gmail.com','cristianangaria','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Roque Vargas',0,'Rovasa08@gmail.com','roquevargas','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Adriana Figueroa',0,'adrianafigueroapabon@gmail.com','adrianafigueroa','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Jhader Fajardo',0,'jhaderfajardo@gmail.com','jhaderfajardo','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Lizeth Campos',0,'Ac6707605@gmail.com','lizethcampos','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Richard Quintero',0,'Arq.richardquintero.15@gmail.com','richardquintero','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Luis Barbudo',0,'ing.luisbarbudo@gmail.com','luisbarbudo','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),
('Jorge Pacheco',0,'Jdavid25@hotmail.com','jorgepacheco','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,21,2,1,false,1,false,false),

-- =========================
-- PROFESIONALES (cargo 10, nivel 3)
-- =========================
('Gustavo Caceres',0,'tavoch1982@gmail.com','gustavocaceres','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,10,3,1,false,1,false,false),
('Carlos Duran',0,'carlosmauricioduranduran@gmail.com','carlosduran','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,10,3,1,false,1,false,false),
('Clara Rojas',0,'rojasdominguezclaraines8@gmail.com','clararojas','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,10,3,1,false,1,false,false),
('Shirly Sanchez',0,'scsancheza.12@gmail.com','shirlysanchez','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,10,3,1,false,1,false,false),
('Lilibeth Ulloa',0,'gpo.seguimiento@gmail.com','lilibethulloa','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,10,3,1,false,1,false,false),
('Diana Alvarez',0,'usosdesueloplaneacion@gmail.com','dianaalvarez','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,10,3,1,false,1,false,false),

-- =========================
-- AUXILIAR (cargo 18, nivel 5)
-- =========================
('Cayetana Vilamizar',0,'caye1030@gmail.com','cayetanavilamizar','$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW',5,5,18,5,1,false,1,false,false);