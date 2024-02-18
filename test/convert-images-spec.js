import fs from "fs";
import {PNG} from "../lib/png.js";
import test from "tape";

fs.readdir(`${__dirname}/in/`, (err, files) => {
  if (err) throw err;

  files = files.filter(file => {
    return Boolean(file.match(/\.png$/i));
  });

  console.log("Converting images");

  files.forEach(file => {
    let expectedError = false;
    if (file.match(/^x/)) {
      expectedError = true;
    }

    test(`convert sync - ${file}`, t => {
      t.timeoutAfter(1000 * 60 * 5);

      let data = fs.readFileSync(`${__dirname}/in/${file}`);
      let png;
      try {
        png = PNG.sync.read(data);
      } catch (e) {
        if (!expectedError) {
          t.fail(
            `Unexpected error parsing..${file}\n${e.message}\n${e.stack}`
          );
        } else {
          t.pass("completed");
        }
        return t.end();
      }

      if (expectedError) {
        t.fail(`Sync: Error expected, parsed fine .. - ${file}`);
        return t.end();
      }

      let outpng = new PNG();
      outpng.gamma = png.gamma;
      outpng.data = png.data;
      outpng.width = png.width;
      outpng.height = png.height;
      outpng.pack().pipe(
        fs
          .createWriteStream(`${__dirname}/outsync/${file}`)
          .on("finish", () => {
            t.pass("completed");
            t.end();
          })
      );
    });

    test(`convert async - ${file}`, t => {
      t.timeoutAfter(1000 * 60 * 5);

      fs.createReadStream(`${__dirname}/in/${file}`)
        .pipe(new PNG())
        .on("error", ({message, stack}) => {
          if (!expectedError) {
            t.fail(
              `Async: Unexpected error parsing..${file}\n${message}\n${stack}`
            );
          } else {
            t.pass("completed");
          }
          t.end();
        })
        .on("parsed", function () {
          if (expectedError) {
            t.fail(`Async: Error expected, parsed fine ..${file}`);
            return t.end();
          }

          this.pack().pipe(
            fs
              .createWriteStream(`${__dirname}/out/${file}`)
              .on("finish", () => {
                t.pass("completed");
                t.end();
              })
          );
        });
    });
  });
});
