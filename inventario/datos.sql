

BEGIN;

-- Ciudades
insert into ciudad (id_ciudad, ciudad, departamento) values
  (1, 'Bogotá', 'Cundinamarca'),
  (2, 'Soacha', 'Cundinamarca'),
  (3, 'Zipaquirá', 'Cundinamarca'),
  (4, 'Facatativá', 'Cundinamarca'),
  (5, 'Fusagasugá', 'Cundinamarca'),
  (6, 'Medellín', 'Antioquia'),
  (7, 'Itagüí', 'Antioquia'),
  (8, 'Envigado', 'Antioquia'),
  (9, 'Bello', 'Antioquia'),
  (10, 'Rionegro', 'Antioquia'),
  (11, 'Cali', 'Valle del Cauca'),
  (12, 'Palmira', 'Valle del Cauca'),
  (13, 'Buenaventura', 'Valle del Cauca'),
  (14, 'Tuluá', 'Valle del Cauca'),
  (15, 'Barranquilla', 'Atlántico'),
  (16, 'Soledad', 'Atlántico'),
  (17, 'Cartagena', 'Bolívar'),
  (18, 'Santa Marta', 'Magdalena'),
  (19, 'Bucaramanga', 'Santander'),
  (20, 'Floridablanca', 'Santander'),
  (21, 'Barrancabermeja', 'Santander'),
  (22, 'Cúcuta', 'Norte de Santander'),
  (23, 'Pereira', 'Risaralda'),
  (24, 'Dosquebradas', 'Risaralda'),
  (25, 'Manizales', 'Caldas'),
  (26, 'Armenia', 'Quindío'),
  (27, 'Ibagué', 'Tolima'),
  (28, 'Neiva', 'Huila'),
  (29, 'Villavicencio', 'Meta'),
  (30, 'Tunja', 'Boyacá'),
  (31, 'Duitama', 'Boyacá'),
  (32, 'Sogamoso', 'Boyacá'),
  (33, 'Pasto', 'Nariño'),
  (34, 'Popayán', 'Cauca'),
  (35, 'Montería', 'Córdoba'),
  (36, 'Valledupar', 'Cesar')
on conflict do nothing;

-- Bodegas (6769 = bodega principal )
INSERT INTO bodega (id_bodega, bodega) VALUES (6769, 'Bodega Principal')
ON CONFLICT (id_bodega) DO NOTHING;

insert into bodega (id_bodega, bodega) values
  (1, 'Bodega Norte - Calle 80'),
  (2, 'Bodega Sur - Autopista Sur'),
  (3, 'Bodega Occidente - Fontibón'),
  (4, 'Bodega Puente Aranda'),
  (5, 'Bodega Siete de Agosto'),
  (6, 'Bodega Zona Industrial Montevideo'),
  (7, 'Bodega Soacha Industrial'),
  (8, 'Bodega Zipaquirá Centro'),
  (9, 'Bodega Medellín - Guayabal'),
  (10, 'Bodega Itagüí Industrial'),
  (11, 'Bodega Bello Norte'),
  (12, 'Bodega Rionegro Aeropuerto'),
  (13, 'Bodega Cali - Acopi Yumbo'),
  (14, 'Bodega Palmira Centro'),
  (15, 'Bodega Buenaventura Puerto'),
  (16, 'Bodega Barranquilla Vía 40'),
  (17, 'Bodega Cartagena Mamonal'),
  (18, 'Bodega Santa Marta Puerto'),
  (19, 'Bodega Bucaramanga Chimitá'),
  (20, 'Bodega Cúcuta Frontera'),
  (21, 'Bodega Pereira La Romelia'),
  (22, 'Bodega Manizales Maltería'),
  (23, 'Bodega Armenia Centro'),
  (24, 'Bodega Ibagué Mirolindo'),
  (25, 'Bodega Neiva Sur'),
  (26, 'Bodega Villavicencio Llano'),
  (27, 'Bodega Tunja Norte'),
  (28, 'Bodega Duitama Industrial'),
  (29, 'Bodega Pasto Centro'),
  (30, 'Bodega Popayán Norte'),
  (31, 'Bodega Montería Sur'),
  (32, 'Bodega Valledupar Centro'),
  (33, 'Bodega Tránsito - Devoluciones'),
  (34, 'Bodega Temporal - Feria Automotriz')
on conflict do nothing;

-- Categorías y materiales
insert into categoria (id_categoria, categoria, linea) values
  (1, 'Tornillo drywall', 'Industrial'),
  (2, 'Tornillo lámina extraplano', 'Industrial'),
  (3, 'Tornillo lámina cabeza redonda', 'Industrial'),
  (4, 'Tornillo hexagonal rosca ordinaria', 'Automotriz'),
  (5, 'Tornillo flange milimétrico', 'Automotriz'),
  (6, 'Tornillo hexagonal milimétrico', 'Automotriz'),
  (7, 'Tornillo carruaje', 'Industrial'),
  (8, 'Tornillo Allen', 'Automotriz'),
  (9, 'Tornillo estufa', 'Industrial')
on conflict do nothing;

insert into material (id_material, material) values
  (1, 'Acero pavonado'),
  (2, 'Acero al carbono'),
  (3, 'Acero galvanizado'),
  (4, 'Acero bicromatizado')
on conflict do nothing;

-- Productos (los autorroscantes no tienen grado ni paso)
insert into producto (codigo, producto, diametro_mm, paso_mm, longitud_mm, grado,
                      id_material, id_categoria, precio_venta, cantidad)
select v.codigo, v.producto, v.diametro, v.paso, v.longitud, v.grado,
       m.id_material, c.id_categoria, v.precio, v.cantidad
from (values
  ('DRYPH61', 'TOR DRYWALL AGLOME PAVONADO 6x1', 3.5, null::numeric, 25.4, null::varchar, 'Acero pavonado', 'Tornillo drywall', 100, 36648),
  ('DRYPH634', 'TOR DRYWALL AGLOME PAVONADO 6x3/4 R.O', 3.5, null::numeric, 19.05, null::varchar, 'Acero pavonado', 'Tornillo drywall', 100, 30194),
  ('LCPHPA812', 'TOR LAMINA EXTRA PLANO PUNTA AGUDA 8X1/2', 4.2, null::numeric, 12.7, null::varchar, 'Acero al carbono', 'Tornillo lámina extraplano', 100, 22884),
  ('DRYPH8112', 'TOR DRYWALL AGLOME PAVONADO 8x1 1/2', 4.2, null::numeric, 38.1, null::varchar, 'Acero pavonado', 'Tornillo drywall', 150, 20246),
  ('DRYPH62', 'TOR DRYWALL AGLOME PAVONADO 6x2', 3.5, null::numeric, 50.8, null::varchar, 'Acero pavonado', 'Tornillo drywall', 200, 19040),
  ('DRYPH6112', 'TOR DRYWALL AGLOME PAVONADO 6x1 1/2', 3.5, null::numeric, 38.1, null::varchar, 'Acero pavonado', 'Tornillo drywall', 100, 16331),
  ('LCPHPB834', 'TOR AUTO EXTRAPLANO K-LATH PTA BROCA 8x3/4', 4.2, null::numeric, 19.05, null::varchar, 'Acero al carbono', 'Tornillo lámina extraplano', 100, 15550),
  ('DRYPH834', 'TOR DRYWALL AGLOME PAVONADO 8x3/4', 4.2, null::numeric, 19.05, null::varchar, 'Acero pavonado', 'Tornillo drywall', 100, 13397),
  ('DRYPH82', 'TOR DRYWALL AGLOME PAVONADO 8x2', 4.2, null::numeric, 50.8, null::varchar, 'Acero pavonado', 'Tornillo drywall', 200, 11910),
  ('LCPH61', 'TOR LAMINA CAB REDONDA PH 6x1', 3.5, null::numeric, 25.4, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 100, 8658),
  ('DRYPH8114', 'TOR DRYWALL AGLOME PAVONADO 8x1 1/4', 4.2, null::numeric, 31.75, null::varchar, 'Acero pavonado', 'Tornillo drywall', 150, 7555),
  ('LCPH10114', 'TOR LAMINA CAB REDONDA PH 10x11/4', 4.8, null::numeric, 31.75, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 300, 7189),
  ('LCPH12112', 'TOR LAMINA CAB REDONDA PH 12x11/2', 5.5, null::numeric, 38.1, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 400, 7008),
  ('DRYPH101', 'TOR DRYWALL AGLOME PAVONADO 10x1', 4.8, null::numeric, 25.4, null::varchar, 'Acero pavonado', 'Tornillo drywall', 200, 4056),
  ('LCPH8114', 'TOR LAMINA CAB REDONDA PH 8x11/4', 4.2, null::numeric, 31.75, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 200, 3676),
  ('LCPH8112', 'TOR LAMINA CAB REDONDA PH 8x11/2', 4.2, null::numeric, 38.1, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 200, 3659),
  ('DRYPH10112', 'TOR DRYWALL AGLOME PAVONADO 10x1 1/2', 4.8, null::numeric, 38.1, null::varchar, 'Acero pavonado', 'Tornillo drywall', 300, 3600),
  ('LCPH6112', 'TOR LAMINA CAB REDONDA PH 6x11/2', 3.5, null::numeric, 38.1, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 100, 3358),
  ('LCPH10112', 'TOR LAMINA CAB REDONDA PH 10x11/2', 4.8, null::numeric, 38.1, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 300, 3342),
  ('LCPH81', 'TOR LAMINA CAB REDONDA PH 8x1', 4.2, null::numeric, 25.4, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 100, 3099),
  ('AOZN141', 'TOR HEX G2 RO GALVANIZADO 1/4x1', 6.35, 1.27::numeric, 25.4, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 300, 2649),
  ('LCPH122', 'TOR LAMINA CAB REDONDA PH 12x2', 5.5, null::numeric, 50.8, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 500, 2420),
  ('LCPH1058', 'TOR LAMINA CAB REDONDA PH 10x5/8', 4.8, null::numeric, 15.88, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 200, 2283),
  ('AMF616', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 6x16', 6, 1.0::numeric, 16, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 500, 2166),
  ('AM625', 'TOR HEX MM PAVONADO DIN 931-933 G 8.8 6x25 P100', 6, 1.0::numeric, 25, '8.8'::varchar, 'Acero pavonado', 'Tornillo hexagonal milimétrico', 500, 2148),
  ('LCPH1034', 'TOR LAMINA CAB REDONDA PH 10x3/4', 4.8, null::numeric, 19.05, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 200, 2117),
  ('LCPH12114', 'TOR LAMINA CAB REDONDA PH 12x11/4', 5.5, null::numeric, 31.75, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 400, 2023),
  ('DRYPH102', 'TOR DRYWALL AGLOME PAVONADO 10x2', 4.8, null::numeric, 50.8, null::varchar, 'Acero pavonado', 'Tornillo drywall', 400, 1845),
  ('AOZN1434', 'TOR HEX G2 RO GALVANIZADO 1/4x3/4', 6.35, 1.27::numeric, 19.05, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 200, 1736),
  ('AM616', 'TOR HEX MM PAVONADO DIN 931-933 G 8.8 6x16 P100', 6, 1.0::numeric, 16, '8.8'::varchar, 'Acero pavonado', 'Tornillo hexagonal milimétrico', 400, 1734),
  ('AMF620', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 6x20', 6, 1.0::numeric, 20, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 500, 1669),
  ('CHZN14112', 'TOR CARRUAJE RO GALVANIZADO 1/4x11/2', 6.35, 1.27::numeric, 38.1, 'G2'::varchar, 'Acero galvanizado', 'Tornillo carruaje', 400, 1620),
  ('AM620', 'TOR HEX MM PAVONADO DIN 931-933 G 8.8 6x20 P100', 6, 1.0::numeric, 20, '8.8'::varchar, 'Acero pavonado', 'Tornillo hexagonal milimétrico', 400, 1510),
  ('AOZN14114', 'TOR HEX G2 RO GALVANIZADO 1/4x1 1/4', 6.35, 1.27::numeric, 31.75, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 300, 1502),
  ('LCPH14112', 'TOR LAMINA CAB REDONDA PH 14x11/2', 6.3, null::numeric, 38.1, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 500, 1457),
  ('AOZN142', 'TOR HEX G2 RO GALVANIZADO 1/4x2', 6.35, 1.27::numeric, 50.8, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 400, 1406),
  ('AM820', 'TOR HEX MM PAVONADO DIN 931 933 G 8.8 8x20 P125 MA', 8, 1.25::numeric, 20, '8.8'::varchar, 'Acero pavonado', 'Tornillo hexagonal milimétrico', 500, 1332),
  ('AMF625', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 6x25', 6, 1.0::numeric, 25, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 500, 1259),
  ('AMF612', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 6x12', 6, 1.0::numeric, 12, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 300, 1210),
  ('AM835', 'TOR HEX MM PAVONADO DIN 931 933 G 8.8 8x35 P125 MA', 8, 1.25::numeric, 35, '8.8'::varchar, 'Acero pavonado', 'Tornillo hexagonal milimétrico', 800, 1118),
  ('LCPH102', 'TOR LAMINA CAB REDONDA PH 10x2', 4.8, null::numeric, 50.8, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 400, 1090),
  ('DRYPH81', 'TOR DRYWALL AGLOME PAVONADO 8x1', 4.2, null::numeric, 25.4, null::varchar, 'Acero pavonado', 'Tornillo drywall', 100, 1059),
  ('AM825', 'TOR HEX MM PAVONADO DIN 931 933 G 8.8 8x25 P125 MA', 8, 1.25::numeric, 25, '8.8'::varchar, 'Acero pavonado', 'Tornillo hexagonal milimétrico', 700, 1035),
  ('AMF835', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 8x35', 8, 1.25::numeric, 35, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 1000, 994),
  ('LCPH142', 'TOR LAMINA CAB REDONDA PH 14x2', 6.3, null::numeric, 50.8, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 600, 991),
  ('AMF630', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 6x30', 6, 1.0::numeric, 30, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 500, 942),
  ('AMF610', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 6x10', 6, 1.0::numeric, 10, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 300, 910),
  ('CHZN385', 'TOR CARRUAJE RO GALVANIZADO 3/8x5', 9.52, 1.59::numeric, 127.0, 'G2'::varchar, 'Acero galvanizado', 'Tornillo carruaje', 1600, 910),
  ('AO8141', 'TOR HEX G8 RO-UNC 1/4x1', 6.35, 1.27::numeric, 25.4, 'G8'::varchar, 'Acero al carbono', 'Tornillo hexagonal rosca ordinaria', 400, 888),
  ('AOZN5161', 'TOR HEX G2 RO GALVANIZADO 5/16x1', 7.94, 1.41::numeric, 25.4, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 400, 886),
  ('LCPH121', 'TOR LAMINA CAB REDONDA PH 12x1', 5.5, null::numeric, 25.4, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 300, 883),
  ('LCPH12212', 'TOR LAMINA CAB REDONDA PH 12x21/2', 5.5, null::numeric, 63.5, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 500, 862),
  ('BCC625', 'TOR ALLEN CABEZA CILINDRICA MM 6x25', 6, 1.0::numeric, 25, '12.9'::varchar, 'Acero al carbono', 'Tornillo Allen', 500, 840),
  ('AMF830', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 8x30', 8, 1.25::numeric, 30, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 1000, 821),
  ('LCPH123', 'TOR LAMINA CAB REDONDA PH 12x3', 5.5, null::numeric, 76.2, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 600, 785),
  ('BCC835', 'TOR ALLEN CABEZA CILINDRICA MM 8x35', 8, 1.25::numeric, 35, '12.9'::varchar, 'Acero al carbono', 'Tornillo Allen', 1300, 784),
  ('EHR3162', 'TOR ESTUFA CAB COMBINADA RO GALVANIZADO 3/16x2', 4.76, 1.06::numeric, 50.8, 'G2'::varchar, 'Acero galvanizado', 'Tornillo estufa', 300, 779),
  ('AMF825', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 8x25', 8, 1.25::numeric, 25, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 1000, 761),
  ('AO8381', 'TOR HEX G8 RO-UNC 3/8x1', 9.52, 1.59::numeric, 25.4, 'G8'::varchar, 'Acero al carbono', 'Tornillo hexagonal rosca ordinaria', 600, 755),
  ('AO838112', 'TOR HEX G8 RO-UNC 3/8x1 1/2', 9.52, 1.59::numeric, 38.1, 'G8'::varchar, 'Acero al carbono', 'Tornillo hexagonal rosca ordinaria', 800, 755),
  ('AMF635', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 6x35', 6, 1.0::numeric, 35, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 500, 744),
  ('AMF820', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 8x20', 8, 1.25::numeric, 20, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 1000, 739),
  ('LCPH14114', 'TOR LAMINA CAB REDONDA PH 14x11/4', 6.3, null::numeric, 31.75, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 500, 723),
  ('AOZN51634', 'TOR HEX G2 RO GALVANIZADO 5/16x3/4', 7.94, 1.41::numeric, 19.05, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 400, 686),
  ('BCC820', 'TOR ALLEN CABEZA CILINDRICA MM 8x20', 8, 1.25::numeric, 20, '12.9'::varchar, 'Acero al carbono', 'Tornillo Allen', 800, 674),
  ('CHZN5162', 'TOR CARRUAJE RO GALVANIZADO 5/16x2', 7.94, 1.41::numeric, 50.8, 'G2'::varchar, 'Acero galvanizado', 'Tornillo carruaje', 700, 670),
  ('BCC830', 'TOR ALLEN CABEZA CILINDRICA MM 8x30', 8, 1.25::numeric, 30, '12.9'::varchar, 'Acero al carbono', 'Tornillo Allen', 1000, 650),
  ('LCPH1012', 'TOR LAMINA CAB REDONDA PH 10x1/2', 4.8, null::numeric, 12.7, null::varchar, 'Acero al carbono', 'Tornillo lámina cabeza redonda', 150, 643),
  ('EHR316112', 'TOR ESTUFA CAB COMBINADA RO GALVANIZADO 3/16x1 1/2', 4.76, 1.06::numeric, 38.1, 'G2'::varchar, 'Acero galvanizado', 'Tornillo estufa', 300, 642),
  ('AO8516112', 'TOR HEX G8 RO-UNC 5/16x1 1/2', 7.94, 1.41::numeric, 38.1, 'G8'::varchar, 'Acero al carbono', 'Tornillo hexagonal rosca ordinaria', 700, 641),
  ('CHZN386', 'TOR CARRUAJE RO GALVANIZADO 3/8x6', 9.52, 1.59::numeric, 152.4, 'G2'::varchar, 'Acero galvanizado', 'Tornillo carruaje', 1800, 640),
  ('AOZN516312', 'TOR HEX G2 RO GALVANIZADO 5/16x3 1/2', 7.94, 1.41::numeric, 88.9, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 1200, 622),
  ('EHR316212', 'TOR ESTUFA CAB COMBINADA RO GALVANIZADO 3/16x2 1/2', 4.76, 1.06::numeric, 63.5, 'G2'::varchar, 'Acero galvanizado', 'Tornillo estufa', 500, 595),
  ('AOZN516112', 'TOR HEX G2 RO GALVANIZADO 5/16x1 1/2', 7.94, 1.41::numeric, 38.1, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 600, 591),
  ('AOZN381', 'TOR HEX G2 RO GALVANIZADO 3/8x1', 9.52, 1.59::numeric, 25.4, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 600, 590),
  ('AO85161', 'TOR HEX G8 RO-UNC 5/16x1', 7.94, 1.41::numeric, 25.4, 'G8'::varchar, 'Acero al carbono', 'Tornillo hexagonal rosca ordinaria', 600, 589),
  ('AMF640', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 6x40', 6, 1.0::numeric, 40, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 600, 588),
  ('AOZN516412', 'TOR HEX G2 RO GALVANIZADO 5/16x4 1/2', 7.94, 1.41::numeric, 114.3, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 1300, 584),
  ('AM830', 'TOR HEX MM PAVONADO DIN 931 933 G 8.8 8x30 P125 MA', 8, 1.25::numeric, 30, '8.8'::varchar, 'Acero pavonado', 'Tornillo hexagonal milimétrico', 800, 562),
  ('EHR31612', 'TOR ESTUFA CAB COMBINADA RO GALVANIZADO 3/16x1/2', 4.76, 1.06::numeric, 12.7, 'G2'::varchar, 'Acero galvanizado', 'Tornillo estufa', 100, 555),
  ('AO812112', 'TOR HEX G8 RO-UNC 1/2x1 1/2', 12.7, 1.95::numeric, 38.1, 'G8'::varchar, 'Acero al carbono', 'Tornillo hexagonal rosca ordinaria', 1500, 544),
  ('EHR1434', 'TOR ESTUFA CAB COMBINADA RO GALVANIZADO 1/4x3/4', 2.9, null::numeric, 19.05, null::varchar, 'Acero galvanizado', 'Tornillo estufa', 300, 543),
  ('EHR3163', 'TOR ESTUFA CAB COMBINADA RO GALVANIZADO 3/16x3', 4.76, 1.06::numeric, 76.2, 'G2'::varchar, 'Acero galvanizado', 'Tornillo estufa', 600, 542),
  ('BCC630', 'TOR ALLEN CABEZA CILINDRICA MM 6x30', 6, 1.0::numeric, 30, '12.9'::varchar, 'Acero al carbono', 'Tornillo Allen', 500, 531),
  ('AOZN5163', 'TOR HEX G2 RO GALVANIZADO 5/16x3', 7.94, 1.41::numeric, 76.2, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 1000, 523),
  ('AMF850', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 8x50', 8, 1.25::numeric, 50, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 1200, 521),
  ('EHR3161', 'TOR ESTUFA CAB COMBINADA RO GALVANIZADO 3/16x1', 4.76, 1.06::numeric, 25.4, 'G2'::varchar, 'Acero galvanizado', 'Tornillo estufa', 200, 516),
  ('AOZN14412', 'TOR HEX G2 RO GALVANIZADO 1/4x4 1/2', 6.35, 1.27::numeric, 114.3, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 900, 492),
  ('AOZN146', 'TOR HEX G2 RO GALVANIZADO 1/4x6', 6.35, 1.27::numeric, 152.4, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 1200, 488),
  ('AM630', 'TOR HEX MM PAVONADO DIN 931-933 G 8.8 6x30 P100', 6, 1.0::numeric, 30, '8.8'::varchar, 'Acero pavonado', 'Tornillo hexagonal milimétrico', 500, 483),
  ('AO851634', 'TOR HEX G8 RO-UNC 5/16x3/4', 7.94, 1.41::numeric, 19.05, 'G8'::varchar, 'Acero al carbono', 'Tornillo hexagonal rosca ordinaria', 400, 480),
  ('AMF815', 'TOR CAB FLANGE MM 8.8 BICROMATIZADO 8x15', 8, 1.25::numeric, 15, '8.8'::varchar, 'Acero bicromatizado', 'Tornillo flange milimétrico', 800, 476),
  ('BCC616', 'TOR ALLEN CABEZA CILINDRICA MM 6x16', 6, 1.0::numeric, 16, '12.9'::varchar, 'Acero al carbono', 'Tornillo Allen', 500, 472),
  ('AOZN144', 'TOR HEX G2 RO GALVANIZADO 1/4x4', 6.35, 1.27::numeric, 101.6, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 800, 470),
  ('AOZN145', 'TOR HEX G2 RO GALVANIZADO 1/4x5', 6.35, 1.27::numeric, 127.0, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 1000, 468),
  ('AM1245125', 'TOR HEX MM PAVONADO DIN 931-933 G 8.8 12x45 P125 MB', 12, 1.25::numeric, 45, '8.8'::varchar, 'Acero pavonado', 'Tornillo hexagonal milimétrico', 2500, 464),
  ('AOZN143', 'TOR HEX G2 RO GALVANIZADO 1/4x3', 6.35, 1.27::numeric, 76.2, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 600, 462),
  ('AM660', 'TOR HEX MM PAVONADO DIN 931-933 G 8.8 6x60 P100', 6, 1.0::numeric, 60, '8.8'::varchar, 'Acero pavonado', 'Tornillo hexagonal milimétrico', 700, 458),
  ('AM840', 'TOR HEX MM PAVONADO DIN 931 933 G 8.8 8x40 P125 MA', 8, 1.25::numeric, 40, '8.8'::varchar, 'Acero pavonado', 'Tornillo hexagonal milimétrico', 1000, 456),
  ('AOZN14312', 'TOR HEX G2 RO GALVANIZADO 1/4x3 1/2', 6.35, 1.27::numeric, 88.9, 'G2'::varchar, 'Acero galvanizado', 'Tornillo hexagonal rosca ordinaria', 800, 451)
) as v(codigo, producto, diametro, paso, longitud, grado, material, categoria, precio, cantidad)
join material  m on m.material  = v.material
join categoria c on c.categoria = v.categoria
on conflict do nothing;

-- Terceros 
insert into tercero (cedula_tercero, nombre_tercero, relacion, tipo_tercero, id_ciudad)
values (222222222222, 'CLIENTE MOSTRADOR (consumidor final)', 'Cliente', 'Persona', 1)
on conflict do nothing;
insert into tercero (cedula_tercero, nombre_tercero, relacion, tipo_tercero, id_ciudad) values
  (900481235, 'Aceros y Fijaciones Del Llano S.A.S.', 'Proveedor', 'Distribuidor', 29),
  (900612478, 'Importadora Tornimax S.A.S.', 'Proveedor', 'Distribuidor', 1),
  (901024561, 'Pernos Industriales Andinos Ltda.', 'Proveedor', null, 6),
  (900738102, 'Distribuciones Metalcorte S.A.S.', 'Proveedor', 'Distribuidor', 11),
  (901155387, 'Forjados del Caribe S.A.S.', 'Proveedor', null, 15),
  (900297634, 'Ferroimport Santander S.A.S.', 'Proveedor', 'Distribuidor', 19),
  (901302945, 'Tornillería Mayorista El Ancla S.A.S.', 'Proveedor', 'Distribuidor', 7),
  (900845210, 'Galvanizados Técnicos de Colombia Ltda.', 'Proveedor', 'Otros', 12),
  (901478023, 'Sujeción Total Importaciones S.A.S.', 'Proveedor', null, 2),
  (900563917, 'Roscas y Mecanizados del Eje S.A.S.', 'Proveedor', 'Otros', 23),
  (901201468, 'Taller Automotriz El Pistón Veloz', 'Cliente', 'Taller', 1),
  (901334790, 'Servitaller La Biela S.A.S.', 'Cliente', 'Taller', 6),
  (901087213, 'Taller Mecánico Doble Tracción', 'Cliente', 'Taller', 11),
  (901412659, 'Autocentro Frenos y Embragues El Cruce', 'Cliente', 'Taller', 19),
  (901276540, 'Taller Diésel Ruta Norte', 'Cliente', 'Taller', 22),
  (901398125, 'Mecánica Rápida La Llave Inglesa', 'Cliente', 'Taller', 27),
  (901159834, 'Taller de Motos Turbo Express', 'Cliente', 'Taller', 23),
  (901520947, 'Latonería y Pintura El Chasis', 'Cliente', 'Taller', 26),
  (900914386, 'Ferretería Central La Tuerca S.A.S.', 'Cliente', 'Distribuidor', 17),
  (900977521, 'Depósito Ferretero Los Andes', 'Cliente', 'Distribuidor', 30),
  (901045678, 'Ferremateriales El Constructor S.A.S.', 'Cliente', 'Distribuidor', 28),
  (900889432, 'Distribuidora Agroindustrial del Sur', 'Cliente', 'Distribuidor', 33),
  (901366214, 'Ferretería Industrial Puerto Nuevo', 'Cliente', 'Distribuidor', 13),
  (900936745, 'Comercializadora Ferretera Costa Azul', 'Cliente', 'Distribuidor', 18),
  (1023456781, 'Andrés Felipe Morales Quintero', 'Cliente', 'Persona', 1),
  (1036789452, 'Laura Camila Restrepo Gil', 'Cliente', 'Persona', 8),
  (1144567893, 'Jhon Jairo Valencia Mosquera', 'Cliente', 'Persona', 11),
  (1098765214, 'María Fernanda Ortiz Rueda', 'Cliente', 'Persona', 20),
  (1053214876, 'Carlos Eduardo Salazar Pineda', 'Cliente', 'Persona', 25),
  (901603258, 'Constructora Horizonte Vertical S.A.S.', 'Cliente', 'Otros', 9),
  (900724913, 'Tornillos y Herramientas El Gremio S.A.S.', 'Ambos', 'Distribuidor', 1),
  (900851376, 'Ferrepartes Automotrices Del Valle S.A.S.', 'Ambos', 'Distribuidor', 11),
  (901092835, 'Repuestos y Fijaciones La Autopista Ltda.', 'Ambos', 'Distribuidor', 6),
  (900667482, 'Mayorista Ferretero Del Oriente S.A.S.', 'Ambos', 'Distribuidor', 22),
  (901248591, 'Suministros Industriales Altiplano S.A.S.', 'Ambos', 'Otros', 31)
on conflict do nothing;

-- Usuarios del sistema (auth_id se llena al vincular cada cuenta de Supabase Auth)
insert into usuario (id_usuario, usuario, rol, auth_id) values
  (1, 'Administrador', 'Admin',   null),
  (2, 'Vendedor',      'Ventas',  null),
  (3, 'Bodeguero',     'Bodega',  null),
  (4, 'Comprador',     'Compras', null)
on conflict do nothing;

-- Permisos por rol (Admin puede todo sin necesidad de filas aquí)
INSERT INTO permiso_movimiento (rol, tipo_movimiento) VALUES
    ('Compras', 'Entrada'),
    ('Ventas',  'Salida'),
    ('Ventas',  'Traslado'),
    ('Bodega',  'Ajuste')
ON CONFLICT DO NOTHING;

COMMIT;