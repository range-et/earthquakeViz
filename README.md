# Earthquake Viz
## General
A simple web viz of earthquakes using deckgl and mapbox
To run the app locally cd into the "dist" folder and run:
(assuming you have python 3 and the http sever module installed)
```
python -m http.server 8000
```
This starts a local server and loads up the files to be viewd online
Otherwise navigate to: 
https://indrajeethaldar.com/sanboxes/earthquakeExample/index.html
To run the app online
In the end you should be left with something that looks like this: 
![Screenshot](Screenshot_2021-11-05_193154.png?raw=true "Screenshot")
## Source Code
Source code for the project is available under the "src" folder. For the most part the code has been annotated to help explain what I'm doing. 
To compile the app locally and run it - 
- git clone the repo
- run `npm install` (assuming you have nodejs installed)

## Ideas 
The project mostly revolves around vizualizing the impact of earthquakes on people, hence in this case I picked to vizualize the earthquake prone region of LA with an overlay of the cencus tract populations (This data was merged independently in qgis). Some other features also include looking at the ring of fire ![Ring_of_fire](https://www.nationalgeographic.org/encyclopedia/ring-fire/ "Ring of fire") as a heatmap (mostly to look at earthquakes at a rather zoomed out scale). Users can also hover over these earthquakes to get information about them.

## Further changes 
- Changed the readme to be more informative
- Added in an alert in the JS code which explains some of whats happening