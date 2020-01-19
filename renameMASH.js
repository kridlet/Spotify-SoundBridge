var fs = require('fs');
var path = require('path');

var moveFrom = "/Volumes/video/TV//MASH";
var moveTo = "/Volumes/Movies/renamed";
var counter = 0;
// Loop through all the files in the temp directory
fs.readdir(moveFrom, function (err, files) {
  if (err) {
    console.error("Could not list the directory.", err);
    process.exit(1);
  }
  console.log(files.length);
  files.forEach(function (file, index) {
    // Make one pass and make the file complete
    var fromPath = path.join(moveFrom, file);
    var toPath = path.join(moveTo, file);

    fs.stat(fromPath, function (error, stat) {
      if (error) {
        console.error("Error stating file.", error);
        return;
      }

      if (stat.isFile()) {
        // console.log("%s", fromPath);

        const regex = /MASH_S([1-9])_D(\d)_T(\d)/gs;
        const str = file;
        let m;

        while ((m = regex.exec(str)) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === regex.lastIndex) {
            regex.lastIndex++;
          }

          // The result can be accessed through the `m`-variable.
          let season= parseInt(m[1]);
          let disc = parseInt(m[2]);
          let track = parseInt(m[3]);
// not all disks have 8
          if ((season == 7 && (disc == 1 || disc == 3)) || (season == 8 && disc == 3) {
            episode = 
          }
          let episode = ((disc-1)*8)+track;
          if (episode<10){
            console.log(file,'MASH_S0'+season+'_E0'+episode+'.mp4');
          } else {
            console.log(file,'MASH_S0'+season+'_E'+episode+'.mp4');
          }
          counter ++;
        }
        console.log(counter);
        // fs.rename(fromPath, toPath, function (error) {
        //   if (error) {
        //     console.error("File moving error.", error);
        //   } else {
        //     console.log("Moved file '%s' to '%s'.", fromPath, toPath);
        //   }
        // });
      } else if (stat.isDirectory()) {
        console.log("'%s' is a directory.", fromPath);
        return "error";
      }
    });
  });
});
console.log(counter);