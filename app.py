from flask import Flask, render_template, Markup, request, jsonify, session
# from graph import corrAbs, build_graph_mongo_multiproc, build_heatmap_mongo, wellIds, dbname, lstOfwavelengths, MongoClient, chunks, lstOfPlots, os, connect_string
from graph import corrAbs, build_graph_multiproc, build_heatmap, wellIds, lstOfwavelengths, chunks, lstOfPlots, os, cr, tableName
from bokeh.embed import components
from functools import partial
import multiprocessing

app = Flask(__name__)
#app.secret_key = os.urandom(10)
#app.config['MONGODB_KEY'] = os.environ.get('MONGODB_KEY')
# client = MongoClient(connect_string)
# db = client[dbname]
# pltcodes=[fi for fi in db.list_collection_names()]

pltcodes = [plt[0] for plt in cr.execute(f"SELECT DISTINCT PLATE_CODE || SUFFIX FROM {tableName}")]
pltcodes.sort()
# unqPltCodes = list(set([plt[:len(plt)-3] for plt in pltcodes]))
unqPltCodes = [plt[0] for plt in cr.execute(f"SELECT DISTINCT PLATE_CODE FROM {tableName}")]
unqPltCodes.sort()

# def replaceSVGparams(svg_string):
#     return svg_string.replace('width="51.84pt"','width="100%"').replace('height="51.84pt"','height="100%"')

@app.route('/')
def plotgraphs():
     return render_template('graphs.html', wvls=lstOfwavelengths,pltcodes=pltcodes,unqPltCodes=unqPltCodes)

@app.route('/updateDf/')
def updateDf():
     #time2s = time.time()
     global lstOfPlots
     selected_pltcode = request.args.get('selected_pltcode').strip()
     # func_partial = partial(build_graph_mongo_multiproc,pltcodeWithSuffix=selected_pltcode)
     func_partial = partial(build_graph_multiproc,pltcodeWithSuffix=selected_pltcode)
     pool = multiprocessing.Pool(processes=4)
     pool.map(func_partial,list(chunks(wellIds,100)) )
     pool.close()
     pool.join()
     #import pdb
     #pdb.set_trace()
     #extracted_vals = [val for val in lstOfPlots]
     #sorted_plts = extracted_vals.sort(key=lambda tup: tup[0])
     #sorted_vals = sorted(extracted_vals,key=lambda tup: tup[0])
     sorted_vals = sorted(lstOfPlots,key=lambda tup: tup[0])
     plts = [Markup(plt[1].decode('utf-8')) for plt in sorted_vals]
     #print(time.time() - time2s)
     return jsonify(htmlLinePlt=render_template('updateDF.html',lstofplots=plts),pltcode=selected_pltcode)

@app.route('/updateHeatmap/')
def updateHeatmap():
     selected_pltcode = request.args.get('selected_pltcode').strip()
     selected_wavelength = request.args.get('wavelength').strip()
     p = build_heatmap(selected_pltcode,selected_wavelength)
     script,div = components(p)
     return jsonify(htmlHeatmap=render_template('updateHeatmap.html',script=script,div=div),pltcode=selected_pltcode,selected_wavelength=selected_wavelength)

@app.route('/updateCorrel/')
def updateCorrel():
    selected_pltcode = request.args.get('selected_pltcode2').strip()
    selected_wavelength = int(request.args.get('wavelength2').strip())
    pltcode100 = selected_pltcode + '100'
    pltcode200 = selected_pltcode + '200'
    corrcoeff = corrAbs(cr,pltcode100,pltcode200,selected_wavelength) #originally had db for mongodb
    return jsonify(htmlCorr=render_template('updateCorrl.html', corrcoeff=corrcoeff))

if __name__ == '__main__':
    app.debug = True
    app.run(host="0.0.0.0", port=8000)
