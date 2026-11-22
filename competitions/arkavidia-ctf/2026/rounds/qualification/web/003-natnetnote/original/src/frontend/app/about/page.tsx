export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">About Natnetnote</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Natnetnote is designed to help you capture ideas, organize thoughts, blablablabla.......
          I was crazy once. they locked me in a room. a rubber room. a rubber room with rats.
          and rats makes me crazy. crazy? I was crazy once...
        </p>
        <p className="text-gray-700 leading-relaxed">
          Give a man a cheese, you feed him a day. give a man a rat, you satisfies his rat desire 
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Features</h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Create, edit, and organize your personal notes</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>View announcements from administrators</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>rat desire</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Clean, intuitive interface built with Tailwind CSS</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Responsive design that works on all devices</span>
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <pre className="font-mono text-black leading-none overflow-auto p-4 whitespace-pre">
          <code>{`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢄⢀⠀⡆⣀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⢿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣦⣼⣾⣿⣿⣿⣷⣷⣶⣤⣤⣀⡀⠀⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⢹⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣸⣶⣴⣾⣿⣿⣿⣿⣿⣿⠟⣿⣿⡿⣿⣿⣿⣤⣾⣶⣦⣼⣴⣤⡀⠀⢀⡀⢰⠋⠘⢨⢮⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣵⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡹⠛⢤⡀⠙⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⣿⣿⣶⣤⣘⢻⣽⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⣠⣾⣿⡿⣿⣿⣿⣿⣿⣟⣿⣻⣿⣇⢁⠊⢙⡛⠞⠀⠈⢻⢷⡘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣙⣿⣿⣿⣿⡟⠟⢿⣿⣿⣿⣷⣿⣿⣿⠸⣬⡥⠖⡿⢃⡔⣠⠀⠛⢾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣾⣿⡟⠚⠛⢽⣛⠶⣦⣿⡻⠄⣝⣗⣿⣿⣇⠙⢻⡇⣿⣼⣟⡻⣦⡀⠘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣠⣼⡿⠉⠀⠀⠘⡂⡀⠛⣧⡐⢽⣰⣌⣻⣌⣷⠻⣧⣉⠉⡑⠙⠛⠃⢿⣿⣾⣿⣿⣿⣿⣟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣹⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢐⣿⣿⣗⣢⠦⠀⠉⠐⠀⠀⠀⠉⢷⣬⢧⠬⣏⠈⢷⣿⣿⣷⣶⣷⣶⠠⡿⢛⣿⡟⡟⢻⣟⣇⢉⠘⢿⣕⣿⣿⣿⣿⣿⣿⣿⣿⣿⡧⡀⠀⠀⠀⢠⠁⠀⠀⠀⠀⠀⠀
⠀⠐⢺⣿⡿⠛⠀⠀⠀⠂⠀⠀⠐⢀⡴⠞⠉⠀⠒⠚⠀⠀⠻⢿⣿⣿⣿⣯⣦⣶⣿⣿⣧⠉⠪⣣⣹⡄⠀⣾⣿⣯⣄⠻⣿⣷⣿⣿⣿⡿⣷⣿⡄⠀⠀⡌⠀⠀⡠⠀⠀⠀⠀
⠀⢐⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠐⠿⠟⡀⣀⠀⠀⠀⠀⣀⣀⣘⣿⣿⣿⣿⣿⣿⣿⣿⡉⠒⢄⢨⡳⠄⢌⢹⣿⣿⣿⣷⣿⢹⢻⣟⣻⣿⣿⣿⣿⣦⣠⠁⠁⠜⠀⠀⠀⠀⠀
⠠⢟⣿⡷⠋⢀⡄⣠⠀⠎⣠⡞⠵⣲⣿⣛⣉⠀⠀⠀⠀⡶⢊⡴⢾⣿⣿⣶⡬⠿⣯⢿⡽⢄⡶⠦⠗⠝⠪⡏⠙⢛⠛⠋⠙⡈⠿⣾⡘⢿⢻⣿⣿⣿⣿⠀⠎⢀⠀⠀⠀⠀⠀
⡠⢾⡿⢢⣾⠍⣀⢠⢀⣾⢇⡄⢀⣿⡿⢗⡃⢰⢄⡤⠞⠁⠈⠤⠙⠙⠯⠯⠀⠀⠀⠀⠉⠀⠁⠀⠀⠀⠀⠙⠂⠈⢁⢀⡠⠹⢾⣿⣦⣸⡆⡿⣿⣿⣿⣧⠐⠁⠀⠀⠀⠀⠀
⠐⣻⣿⣿⣷⣠⢵⠗⣿⢅⣾⣷⣾⣿⢀⣿⡷⣽⡟⡴⢖⠂⠈⠁⢀⠀⠐⠀⠀⡀⢀⡡⠆⣄⣁⠀⠀⠀⠀⠀⠀⠀⠀⡈⠉⠗⣶⣍⢿⣧⡓⡅⠁⢻⣿⣿⣧⠀⠀⠀⠀⠀⠀
⠰⢿⣿⣿⣿⢏⣿⠞⣿⡿⢫⣿⠟⣍⣿⣿⣿⣿⣿⣵⠉⢠⠗⢫⢽⣦⣆⣴⡋⡅⡉⠀⠀⠀⠀⠀⠀⠐⠀⠀⠀⠀⠀⠘⠋⢹⣿⠿⣿⣶⢯⣵⣶⠛⠻⠻⣿⡇⠀⠀⠀⠀⠀
⠀⠨⣿⣿⣷⢿⣏⣸⣏⡱⢃⠏⣠⡏⣟⡿⣿⣿⣿⠾⠁⠚⢲⣿⣿⣿⣿⣿⣿⣷⡶⣶⣦⢤⣤⣞⣡⡶⠥⠖⠒⠒⠭⣉⣉⣭⣷⢦⡞⢉⢉⣿⣿⡠⣷⢤⡿⠀⠀⠀⠀⠀⠀
⠀⠀⣿⣿⣿⣿⣟⣤⣿⠡⣼⡀⠛⣧⢿⣶⣩⣟⠁⠃⣀⣤⣿⣿⣿⡿⠉⠀⠉⠈⠀⣈⠤⠤⠜⢹⡟⢛⣽⡷⢶⡿⣿⣿⣿⣿⢛⡽⢿⣽⢣⢭⣏⡦⠾⠋⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠠⠋⣿⣽⣿⣼⣿⣾⣿⠿⠟⠛⡞⡿⢿⠿⠿⠾⠿⠿⠿⠿⠛⢁⣀⣀⠠⠔⠉⠀⠀⠐⠒⡺⠖⢋⡀⠀⢸⣿⣿⣿⠛⠙⠛⠲⠵⠷⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠘⠛⣿⣇⣿⣿⠉⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣷⣤⣤⣶⣾⣭⣉⠉⣡⣴⣾⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠠⡏⢿⣿⣿⠇⠀⠀⡀⢂⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⢿⣿⡯⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠈⠘⣿⣿⡇⢇⣷⣿⣯⣷⣿⣶⣤⣄⠀⠀⠀⣽⣿⡿⡟⢿⣽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⢤⣾⣿⣷⣴⠅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠉⠹⢿⣾⣿⣿⣿⣿⣿⣿⣿⣛⣢⠤⢤⣺⣿⣟⠀⣾⣿⣿⣿⣿⡟⣿⢻⣿⢻⣿⠃⣸⣿⣿⣿⣿⣿⣷⣂⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠿⣿⣿⣿⠟⣿⣿⡓⡄⠈⣟⢿⣿⣿⣿⣿⣿⣿⣿⣿⣯⣿⣿⣯⣼⣿⢷⣿⣿⣿⣿⣿⣟⣿⣧⣄⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣠
⠀⠀⠀⠀⠀⠀⠀⣀⣠⡤⣤⠤⠴⠾⠷⠾⢿⣿⣿⣿⣤⣤⣿⣻⣿⣿⣿⣿⡿⢇⡄⠉⠛⢿⣿⣿⢿⠳⠘⠉⠡⠻⡋⠫⢗⡚⠿⠿⢿⡿⠿⠿⣿⢿⠿⣿⣿⡿⡿⡿⣿⣻⣿
⠀⠀⠀⠀⢠⣶⣟⢻⠏⢩⠤⠀⣀⣀⣀⣤⠶⠿⠥⠘⠛⠛⠛⠛⠻⠿⠿⠿⢶⣿⣤⢤⢟⡼⠿⣷⣠⣤⡶⣗⣜⡇⠬⠷⠦⠶⡑⠀⠶⠆⣿⣷⣦⣾⢞⣿⣽⣿⣿⣿⣿⣿⣿
⠀⠀⠀⠀⠀⠘⠛⠃⠬⠁⠒⠻⠏⡻⣁⠠⣀⠀⠀⢀⣀⣀⠤⠆⠀⠀⠀⠀⢀⣼⡿⣦⣞⠥⠖⠛⠛⠛⠛⠛⠛⠒⠒⠓⠓⠒⠚⠒⠒⠒⠒⠛⠓⠛⠒⠛⠛⠛⠛⠛⠉⠉⠉
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠁⠛⠒⠚⠒⠚⠛⠻⠤⠥⠤⠖⠖⠒⠒⠒⠒⠚⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀                              
          `}</code>
        </pre>
      </div>
    </div>
  );
}