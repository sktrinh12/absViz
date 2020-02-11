### Absorbance visualization for 384-well plate

Dockerized flask app that shows absorbance line plots for each well of a 384-well QC plate. Select platecode from dropdown list and wait for the line plots to be produced (~10s). Afterwards, the user has the option to show a heatmap of the highest absorbing wells; used to identify fractions with most aromatic compounds. Lastly, the user can determine the pearson correlation, or the similiarity between the 100-set and the 200-set of a selected platecode.

The app does not require the internet and was built to be run on a VLAN without internet access. The docker file should be in the parent directory, outside of the current directory.


#### Demo of the app
![absvizdemo](/Users/trinhsk/Documents/GitRepos/absViz_offline/384QC_offline/static/demo.gif) 
