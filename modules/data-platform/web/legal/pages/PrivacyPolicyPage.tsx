import { LegalPageLayout } from "../components/LegalPageLayout";

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      lastUpdated="September 2026"
      title="Datenschutzerklärung"
    >
      <h2>1. Verantwortlicher</h2>

      <p>
        Simon Posner
        <br />
        Gebhardshagen 1
        <br />
        37691 Boffzen
        <br />
        Deutschland
        <br />
        E-Mail:{" "}
        <a href="mailto:simon.posner1991@magenta.de">
          simon.posner1991@magenta.de
        </a>
      </p>

      <h2>2. Überblick der Verarbeitung</h2>

      <p>
        SynTrack ist ein privates, nicht-kommerzielles Werkzeug zur
        persönlichen Fortschrittsverfolgung in World of Warcraft. Es
        erhebt ausschließlich Daten, die für die Bereitstellung dieser
        Funktion notwendig sind. Es findet kein Tracking, keine
        Analyse-Software und keine Werbung statt; es werden keine Daten
        verkauft oder zu Marketingzwecken weitergegeben.
      </p>

      <h2>3. Anmeldung über Battle.net</h2>

      <p>
        Die Anmeldung bei SynTrack erfolgt ausschließlich über den
        offiziellen OAuth-Anmeldedienst von Blizzard Entertainment
        (&quot;Battle.net&quot;). SynTrack verarbeitet dabei:
      </p>

      <ul>
        <li>
          deine Battle.net-Konto-ID und deinen BattleTag, zur
          eindeutigen Identifikation deines SynTrack-Kontos;
        </li>
        <li>
          ein von Battle.net ausgestelltes Zugriffs-Token, ausschließlich
          serverseitig gespeichert, um in deinem Namen öffentliche
          Charakterdaten (Ausrüstung, Berufe, Erfolge, Mythic-Plus) bei
          Blizzards Community-API abzurufen;
        </li>
        <li>
          die Liste deiner WoW-Charaktere, wie sie von Battle.net
          zurückgegeben wird.
        </li>
      </ul>

      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Erfüllung eines
        Vertrags bzw. vorvertragliche Maßnahmen auf deine Anfrage hin —
        du forderst diesen Dienst durch die Anmeldung aktiv an).
      </p>

      <p>
        Neu registrierte Konten müssen zusätzlich von einem
        Administrator manuell freigeschaltet werden, bevor sie SynTrack
        nutzen können. Dies dient ausschließlich dem Zugriffsschutz
        eines kleinen, privaten Nutzerkreises.
      </p>

      <h2>4. Spieldaten aus dem WoW-Addon und dem Desktop-Client</h2>

      <p>
        Wenn du das SynTrack-Addon oder den optionalen
        SynTrack-Desktop-Client nutzt, werden zusätzlich Spieldaten aus
        deinem World-of-Warcraft-Client übertragen und mit deinem Konto
        verknüpft — z. B. Ausrüstung, Berufsfortschritt, wöchentliche
        Aktivitäten und Mythic-Plus-Läufe. Diese Daten dienen
        ausschließlich der Darstellung deines eigenen Fortschritts
        innerhalb von SynTrack. Rechtsgrundlage ist ebenfalls Art. 6
        Abs. 1 lit. b DSGVO.
      </p>

      <p>
        Der Desktop-Client verbindet sich hierfür einmalig über einen
        Kopplungscode mit deinem SynTrack-Konto; danach synchronisiert
        er automatisch im Hintergrund.
      </p>

      <h2>5. Lokale Speicherung im Browser</h2>

      <p>
        SynTrack speichert nach dem Login ein Sitzungs-Token im{" "}
        <code>localStorage</code> deines Browsers, um dich angemeldet zu
        halten. Diese Speicherung ist technisch zwingend erforderlich,
        damit der von dir ausdrücklich angeforderte Dienst
        funktioniert (§ 25 Abs. 2 Nr. 2 TTDSG); es findet keine
        darüberhinausgehende Speicherung, kein Tracking und keine
        Profilbildung statt, weshalb hierfür keine gesonderte
        Einwilligung (z. B. per Cookie-Banner) erforderlich ist.
      </p>

      <h2>6. Optionale Drittanbieter-Funktion: Droptimizer-Reports</h2>

      <p>
        Wenn du im Loot-Bereich freiwillig einen Report-Link von{" "}
        <a
          href="https://www.raidbots.com"
          rel="noreferrer"
          target="_blank"
        >
          raidbots.com
        </a>{" "}
        einfügst, ruft unser Server die zu diesem Link öffentlich
        abrufbaren Simulationsdaten bei Raidbots ab und speichert eine
        Zusammenfassung (simulierte Werte, mögliche Ausrüstungs-Upgrades)
        in deinem Konto. Es werden dabei keine Battle.net- oder
        Kontodaten an Raidbots übertragen — lediglich die von dir
        eingefügte, bereits öffentliche Report-Kennung wird abgerufen.
        Diese Funktion wird nur aktiv, wenn du sie selbst nutzt.
      </p>

      <h2>7. Server und Protokolldaten</h2>

      <p>
        SynTrack läuft auf einer vom Betreiber kontrollierten
        Server-Infrastruktur. Beim Zugriff auf die Website werden
        technisch notwendige Verbindungsdaten (z. B. IP-Adresse,
        Zeitpunkt der Anfrage) durch die eingesetzte Server-Software
        kurzzeitig verarbeitet, um den Betrieb und die Sicherheit des
        Dienstes zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO,
        berechtigtes Interesse an einem funktionierenden und sicheren
        Betrieb). Es findet keine darüberhinausgehende Auswertung
        statt.
      </p>

      <h2>8. Speicherdauer</h2>

      <p>
        Deine Daten werden gespeichert, solange dein SynTrack-Konto
        besteht. Auf Anfrage (siehe Punkt 9) werden dein Konto und die
        damit verknüpften Daten gelöscht.
      </p>

      <h2>9. Deine Rechte</h2>

      <p>Du hast jederzeit das Recht auf:</p>

      <ul>
        <li>Auskunft über die zu dir gespeicherten Daten (Art. 15 DSGVO),</li>
        <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO),</li>
        <li>
          Löschung deiner Daten bzw. deines Kontos (Art. 17 DSGVO),
        </li>
        <li>Einschränkung der Verarbeitung (Art. 18 DSGVO),</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO) und</li>
        <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO).</li>
      </ul>

      <p>
        Wende dich hierzu einfach per E-Mail an{" "}
        <a href="mailto:simon.posner1991@magenta.de">
          simon.posner1991@magenta.de
        </a>
        . Zusätzlich steht dir ein Beschwerderecht bei einer
        Datenschutz-Aufsichtsbehörde zu.
      </p>
    </LegalPageLayout>
  );
}
