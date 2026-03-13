export async function runSEGTECConfiguracionExtendMigration(db) {

  await db.exec(`
    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN naturaleza_funcional TEXT;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN recibe_solicitudes INTEGER DEFAULT 0;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN emite_actos INTEGER DEFAULT 0;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN afecta_terceros INTEGER DEFAULT 0;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN procesos_principales TEXT;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN tramites_frecuentes TEXT;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN decisiones_tipo TEXT;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN genera_actos INTEGER DEFAULT 0;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN genera_informes INTEGER DEFAULT 0;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN genera_comunicaciones INTEGER DEFAULT 0;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN genera_conceptos INTEGER DEFAULT 0;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN genera_contratos INTEGER DEFAULT 0;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN genera_actas INTEGER DEFAULT 0;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN genera_resoluciones INTEGER DEFAULT 0;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN genera_memorandos INTEGER DEFAULT 0;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN genera_expedientes INTEGER DEFAULT 0;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN genera_otros TEXT;

    ALTER TABLE segtec_configuracion_dependencia
    ADD COLUMN descripcion_funcional TEXT;
  `);

}