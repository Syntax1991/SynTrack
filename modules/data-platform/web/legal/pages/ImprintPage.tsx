import { LegalPageLayout } from "../components/LegalPageLayout";

export function ImprintPage() {
  return (
    <LegalPageLayout
      lastUpdated="September 2026"
      title="Impressum"
    >
      <h2>Angaben gemäß § 5 TMG</h2>

      <p>
        Simon Posner
        <br />
        Gebhardshagen 1
        <br />
        37691 Boffzen
        <br />
        Deutschland
      </p>

      <h2>Kontakt</h2>

      <p>
        E-Mail:{" "}
        <a href="mailto:simon.posner1991@magenta.de">
          simon.posner1991@magenta.de
        </a>
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>

      <p>Simon Posner (Anschrift wie oben)</p>

      <h2>Hinweis zum Angebot</h2>

      <p>
        SynTrack ist ein privates, nicht-kommerzielles Hobby-Projekt zur
        persönlichen Fortschrittsverfolgung in World of Warcraft. Es
        werden keine Werbeflächen vermarktet und keine Gebühren erhoben.
      </p>

      <h2>Haftung für Inhalte</h2>

      <p>
        Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene
        Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
        verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter
        jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
        Informationen zu überwachen oder nach Umständen zu forschen, die
        auf eine rechtswidrige Tätigkeit hinweisen.
      </p>

      <p>
        Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
        Informationen nach den allgemeinen Gesetzen bleiben hiervon
        unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
        Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
        Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden
        wir diese Inhalte umgehend entfernen.
      </p>

      <h2>Haftung für Links</h2>

      <p>
        Unser Angebot enthält Links zu externen Webseiten Dritter (z. B.
        Blizzard Entertainment, Raidbots), auf deren Inhalte wir keinen
        Einfluss haben. Deshalb können wir für diese fremden Inhalte auch
        keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten
        ist stets der jeweilige Anbieter oder Betreiber der Seiten
        verantwortlich.
      </p>

      <h2>Markenhinweis</h2>

      <p>
        World of Warcraft, Warcraft und Blizzard Entertainment sind
        Marken bzw. eingetragene Marken von Blizzard Entertainment, Inc.
        in den USA und/oder anderen Ländern. Alle Spielinhalte,
        Bezeichnungen, Symbole und Icons, die sich auf World of Warcraft
        beziehen, sind Eigentum von Blizzard Entertainment, Inc.
      </p>

      <p>
        SynTrack ist ein inoffizielles Fan-Projekt und steht in keiner
        Verbindung zu Blizzard Entertainment. Es wird nicht von Blizzard
        Entertainment unterstützt, gesponsert, betrieben oder geprüft
        (&quot;not affiliated with, endorsed, sponsored, or specifically
        approved by Blizzard Entertainment&quot;).
      </p>

      <h2>Streitschlichtung</h2>

      <p>
        Die Europäische Kommission stellt eine Plattform zur
        Online-Streitbeilegung (OS) bereit:{" "}
        <a
          href="https://ec.europa.eu/consumers/odr/"
          rel="noreferrer"
          target="_blank"
        >
          https://ec.europa.eu/consumers/odr/
        </a>
        . Wir sind nicht verpflichtet und nicht bereit, an
        Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </LegalPageLayout>
  );
}
