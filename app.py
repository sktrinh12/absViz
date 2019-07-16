from flask import render_template, Markup, request, jsonify, session
from graph import corrAbs, build_graph_multiproc, build_heatmap, wellIds, getLstOfwavelengths, chunks, lstOfPlots, os, cr, app
from bokeh.embed import components
from functools import partial
import multiprocessing


tableName_abs = 'WELL_ABSORBANCE'
tableName_stats = 'ABSORBANCE_STATS'

lstOfwavelengths = list(range(220,810,10))
pltcodes = [plt[0] for plt in cr.execute(f"SELECT DISTINCT PLATE_CODE || PLATE_SUFFIX FROM {tableName_abs}")]
pltcodes.sort()
unqPltCodes = [plt[0] for plt in cr.execute(f"SELECT DISTINCT PLATE_CODE FROM {tableName_abs}")]
unqPltCodes.sort()

@app.route('/')
def main():
     selected_pltcode = pltcodes[0]
     return render_template('graphs.html', wvls=getLstOfwavelengths(tableName_abs,selected_pltcode),pltcodes=pltcodes,unqPltCodes=unqPltCodes)


@app.route('/updateMain/')
def updateMain():
    selected_pltcode = request.args.get('selected_pltcode')
    if int(selected_pltcode[2:4]) < 19:
        wavelength = getLstOfwavelengths(tableName_abs,selected_pltcode)
    else:
        wavelength = lstOfwavelengths
    return jsonify(wavelength=wavelength,selected_pltcode=selected_pltcode)

@app.route('/updateDf/')
def updateDf():
     global lstOfPlots
     selected_pltcode = request.args.get('selected_pltcode')
     selected_wavelength = request.args.get('wavelength').strip()
     func_partial = partial(build_graph_multiproc,lstOfwavelengths=lstOfwavelengths,pltcodeWithSuffix=selected_pltcode)
     pool = multiprocessing.Pool(processes=multiprocessing.cpu_count())
     pool.map(func_partial,list(chunks(wellIds,384)) )
     pool.close()
     pool.join()
     sorted_vals = sorted(lstOfPlots,key=lambda tup: tup[0])
     plts = [Markup(plt[1].decode('utf-8')) for plt in sorted_vals]
     return jsonify(htmlLinePlt=render_template('updateDF.html',lstofplots=plts),pltcode=selected_pltcode,selected_wavelength=selected_wavelength,wvls=lstOfwavelengths)

@app.route('/updateHeatmap/')
def updateHeatmap():
     selected_pltcode = request.args.get('selected_pltcode').strip()
     selected_wavelength = request.args.get('wavelength').strip()
     p = build_heatmap(selected_pltcode,selected_wavelength)
     script,div = components(p)
     return jsonify(htmlHeatmap=render_template('updateHeatmap.html',script=script,div=div),pltcode=selected_pltcode,selected_wavelength=selected_wavelength,wvls=lstOfwavelengths)

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
