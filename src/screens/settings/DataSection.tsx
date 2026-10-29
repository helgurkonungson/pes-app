/** Settings → Data: export a backup, restore, the automatic backup note, delete everything (ADR-036). */
import { Download, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useBackupRestore } from "../../components/FilePickers";
import { confirmDialog, Group, MenuRow, SectionLabel, toast } from "../../components/ui";
import { localDay } from "../../core/dates";
import { exportBackup, wipeAll } from "../../data/repo";
import { clearSnapshots } from "../../data/safety";
import { useT } from "../../i18n";
import { shareTextFile } from "../../native/share";
import { useNav } from "../../nav/store";

export function DataSection() {
  const t = useT();
  const reset = useNav((s) => s.reset);
  const restore = useBackupRestore(() => reset());

  const doExport = async () => {
    try {
      await shareTextFile(`pes-backup-${localDay()}.json`, JSON.stringify(await exportBackup()), t("settings.backupShareTitle"));
    } catch {
      toast(t("settings.exportFailed"));
    }
  };

  const doWipe = async () => {
    if (await confirmDialog(t("settings.wipeConfirm"), { text: t("settings.wipeText"), ok: t("settings.wipeOk"), danger: true })) {
      await clearSnapshots();
      await wipeAll();
      reset();
    }
  };

  return (
    <section className="stack">
      <SectionLabel>{t("settings.data")}</SectionLabel>
      <Group>
        <MenuRow icon={<Download size={20} />} label={t("settings.export")} hint={t("settings.exportHint")} onClick={doExport} />
        <MenuRow icon={<Upload size={20} />} label={t("settings.restore")} onClick={restore.open} />
        <MenuRow icon={<ShieldCheck size={20} />} label={t("settings.autoBackup")} hint={t("settings.autoBackupHint")} />
        <MenuRow icon={<Trash2 size={20} />} label={t("settings.wipe")} onClick={doWipe} danger />
      </Group>
      {restore.input}
    </section>
  );
}
