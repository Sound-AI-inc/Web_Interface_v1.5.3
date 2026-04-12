import SectionHeading from "../../components/SectionHeading";

const licenses = [
  {
    name: "React",
    version: "18.x",
    license: "MIT License",
    url: "https://github.com/facebook/react",
  },
  {
    name: "Vite",
    version: "6.x",
    license: "MIT License",
    url: "https://github.com/vitejs/vite",
  },
  {
    name: "Tailwind CSS",
    version: "3.x",
    license: "MIT License",
    url: "https://github.com/tailwindlabs/tailwindcss",
  },
  {
    name: "Lucide Icons",
    version: "0.364+",
    license: "ISC License",
    url: "https://github.com/lucide-icons/lucide",
  },
  {
    name: "React Router",
    version: "6.x",
    license: "MIT License",
    url: "https://github.com/remix-run/react-router",
  },
  {
    name: "Poppins Font",
    version: "N/A",
    license: "Open Font License",
    url: "https://fonts.google.com/specimen/Poppins",
  },
  {
    name: "Inter Font",
    version: "N/A",
    license: "Open Font License",
    url: "https://fonts.google.com/specimen/Inter",
  },
];

export default function Licenses() {
  return (
    <section className="section-padding">
      <div className="container-max max-w-4xl">
        <SectionHeading
          badge="Legal"
          title="Licenses"
          subtitle="Third-party and open-source components used in the SoundAI platform."
        />

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="text-left py-3 px-4 font-poppins font-semibold text-gray-600 dark:text-light-bg/70">Component</th>
                  <th className="text-left py-3 px-4 font-poppins font-semibold text-gray-600 dark:text-light-bg/70">Version</th>
                  <th className="text-left py-3 px-4 font-poppins font-semibold text-gray-600 dark:text-light-bg/70">License</th>
                  <th className="text-left py-3 px-4 font-poppins font-semibold text-gray-600 dark:text-light-bg/70">Source</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((l) => (
                  <tr key={l.name} className="border-b border-gray-200 dark:border-white/5 hover:bg-white/2">
                    <td className="py-3 px-4 text-light-bg/80 font-medium">{l.name}</td>
                    <td className="py-3 px-4 text-gray-500 dark:text-light-bg/50 font-mono text-xs">{l.version}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-accent-cyan/10 text-accent-cyan">
                        {l.license}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-pink text-xs hover:underline"
                      >
                        GitHub
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 card">
          <h3 className="font-poppins font-semibold text-lg mb-3">SoundAI Platform License</h3>
          <p className="text-gray-500 dark:text-light-bg/50 text-sm leading-relaxed mb-4">
            The SoundAI platform, including its AI models, generation pipeline, API, and proprietary technology,
            is the intellectual property of SoundAI Inc. and is not open-source. Access is governed by the
            Terms of Use and applicable subscription agreements.
          </p>
          <p className="text-gray-500 dark:text-light-bg/50 text-sm leading-relaxed">
            Generated assets are owned by the user who created them, subject to the Terms of Use.
            SoundAI does not claim ownership of user-generated content.
          </p>
        </div>
      </div>
    </section>
  );
}
