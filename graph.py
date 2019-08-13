from matplotlib.backends.backend_svg import FigureCanvasSVG
from matplotlib.figure import Figure
import string
from bokeh.plotting import figure
from bokeh.models import HoverTool
import io
import numpy as np
import multiprocessing
import os
#import sqlite3
import cx_Oracle
from flask import Flask 

app = Flask(__name__)
#connect_string = app.instance_path.replace('/instance','') + '/static/abs384QCdb.db'
#print(connect_string)
#connect_string = '/Users/trinhsk/Documents/GitRepos/absViz_offline/384QC_offline/static/abs384QCdb.db'
#conn = sqlite3.connect(connect_string)
#tableName = "QCabsVals"
tableName_abs = 'WELL_ABSORBANCE'
tableName_stats = 'ABSORBANCE_STATS'

host = os.environ['ORACLE_HOST']
port = os.environ['ORACLE_PORT']
servname = os.environ['ORACLE_SERVNAME']
passwrd = os.environ['ORACLE_PASS']
user = os.environ['ORACLE_USER']

dsn_tns = cx_Oracle.makedsn(host,port,service_name=servname)
conn = cx_Oracle.connect(user,passwrd,dsn_tns)
cr = conn.cursor()

manager = multiprocessing.Manager()
lstOfPlots = manager.list()
emptyWells= {f"{chr(65+i)}01" if i < 16 else f"{chr(65+i%16)}02":0 for i in range(32)} #empty first two columns on plate

wellIds=[]
cnt=0
for i in range(1,17):
    for j in range(1,25): 
        if j < 10:
            j = '0'+ str(j)
        wellIds.append((cnt,f'{chr(64+i)}{j}'))
        cnt+=1

def getLstOfwavelengths(tableName,pltcodeWithSuffix):
    pltcode = pltcodeWithSuffix[:8]
    #suffix = pltcodeWithSuffix[8:11]
    #return [r[0] for r in cr.execute(f"SELECT DISTINCT WAVELENGTH FROM {tableName} WHERE PLATE_CODE = {pltcode} AND PLATE_SUFFIX = {suffix} ORDER BY WAVELENGTH")]
    return [r[0] for r in cr.execute(f"SELECT DISTINCT WAVELENGTH FROM {tableName} WHERE PLATE_CODE = {pltcode} ORDER BY WAVELENGTH")]

def chunks(l, n):
    '''takes a list and integer n as input and returns
    generator objects of n lengths from that list'''
    for i in range(0, len(l), n):
        yield l[i:i + n]

def getWavelengthData(cr,tableName,pltcodeWithSuffix,wv):
    pltcode = pltcodeWithSuffix[:8]
    suffix = pltcodeWithSuffix[8:11]
    datadict = {}
    for k,v in cr.execute(f'''SELECT PLATE_POSITION,READING FROM {tableName} WHERE PLATE_CODE = '{pltcode}' and WAVELENGTH = {wv} AND PLATE_SUFFIX = '{suffix}' '''):
        datadict[k] = v
    return datadict

def getAllWellVals(cr,tableName,pltcodeWithSuffix,wellID):
    pltcode = pltcodeWithSuffix[:8]
    suffix = pltcodeWithSuffix[8:11]
    return [r[0] for r in cr.execute(f'''SELECT READING FROM {tableName} WHERE PLATE_POSITION =
            '{wellID}' and PLATE_CODE = {pltcode} AND PLATE_SUFFIX = {suffix}''')]


def build_graph_multiproc(chunk,lstOfwavelengths,pltcodeWithSuffix):
    global lstOfPlots
    with cx_Oracle.connect(user,passwrd,dsn_tns) as conn:
        cr = conn.cursor()
        for i, wid in chunk:
            img = io.BytesIO()
            fig = Figure(figsize=(0.6,0.6))
            axis = fig.add_subplot(1,1,1)
            absVals = getAllWellVals(cr,tableName_abs,pltcodeWithSuffix,wid)
            if int(pltcodeWithSuffix[2:4]) < 18: 
                lstOfwavelengths = getLstOfwavelengths('WELL_ABSORBANCE',pltcodeWithSuffix)

            axis.plot(lstOfwavelengths,absVals)
            axis.set_title(f'{wid}',fontsize=9)
            axis.title.set_position([.5, .6])
            axis.tick_params(
                    which='both',
                    bottom=False,
                    left=False,
                    labelbottom=False,
                    labelleft=False)
            FigureCanvasSVG(fig).print_svg(img)
            result = img.getvalue()
            try:
                lstOfPlots[i] = (i,result)
            except IndexError:
                lstOfPlots.append((i,result))

def build_heatmap(pltcodeWithSuffix,wavelength):
    #with sqlite3.connect(connect_string) as conn_:
    with cx_Oracle.connect(user,passwrd,dsn_tns) as conn:
        cr = conn.cursor()
        datadict = getWavelengthData(cr,tableName_abs, pltcodeWithSuffix,int(wavelength))
        max_val = np.array([v for v in datadict.values()]).max()
        min_val = abs(np.array([v for v in datadict.values()])).min()
        if int(pltcodeWithSuffix[2:4]) < 19: 
            for k in wellIds:
                if k[1] in datadict.keys():
                    pass
                else:
                    datadict[k[1]] = 0
            datadict = dict(sorted(datadict.items()))
        data_array = np.array(list(datadict.values())).reshape(16,24).T
        colourBlue = [ '#E3E6E8', '#E0E7EB', '#DEE8ED', '#DBE9F0', '#D9EAF2', '#D6EBF5', '#D4EBF7', '#D1ECFA', '#CFEDFC', '#CCEEFF', '#A8D8F0', '#A3DAF5', '#9EDBFA', '#99DDFF', '#7DC4E8', '#75C7F0', '#6EC9F7', '#66CCFF' ]
        nphist = np.linspace(min_val,max_val,num=len(colourBlue))
        lamDiff = lambda x: [abs(x-i) for i in nphist].index(min([abs(x-i) for i in nphist]))
        colours=[]
        for i in range(data_array.shape[0]):
            for j in range(data_array.shape[1]):
                if data_array[i,j] < 0 or data_array[i,j] == 0:
                    colours.append('#5C6970')
                else:
                    colours.append(colourBlue[lamDiff(data_array[i,j])])
        xs = list(map(lambda x: [x]*16,list(range(24))))
        xs = [str(item+1) for sublist in xs for item in sublist] #flatten list
        strings = [i for i in string.ascii_uppercase[0:16]]*24
        df = {'xs':xs,'ys':strings,'value':data_array.flatten(),'colour':colours}
        p = figure(plot_width=1600,plot_height=1200,x_axis_location="above", tools="hover",
                   sizing_mode='scale_width',
                   x_range=[str(i) for i in range(1,25)],
                   y_range=list(reversed([i for i in string.ascii_uppercase[:16]])),
                   tooltips = [('wellID', '@ys,@xs'), ('abs', '@value')])
        p.rect('xs', 'ys', .64,.64 ,source=df, fill_color='colour',line_color='black')
        p.toolbar.logo = None
        p.toolbar_location = None
        p.xgrid.grid_line_color = None
        p.ygrid.grid_line_color = None
        return p


def corrAbs(db,pltcodeWithSuffix1,pltcodeWithSuffix2,wavelength):
    #with sqlite3.connect(connect_string) as conn_:
    with cx_Oracle.connect(user,passwrd,dsn_tns) as conn:
        cr = conn.cursor()
        crude = list(getWavelengthData(cr,tableName_abs,pltcodeWithSuffix1,wavelength).values())
        fx = list(getWavelengthData(cr,tableName_abs,pltcodeWithSuffix2,wavelength).values())
        if int(pltcodeWithSuffix1[2:4]) < 19 and int(pltcodeWithSuffix2[2:4]) < 19: 
            darray_crude = np.array(crude).reshape(16,12)
            darray_fx = np.array(fx).reshape(16,12)
            darray_t = np.flip(np.flip(darray_crude.T,axis=1),axis=0).reshape(16,12) 
        else:
            darray_crude = np.array(crude).reshape(16,24)
            darray_fx = np.array(fx).reshape(16,24)
            darray_t = np.flip(np.flip(darray_crude.T,axis=1),axis=0).reshape(16,24) #flip the 100 plate
        ar_crude = np.delete(np.delete(np.delete(darray_crude, np.s_[1::2], 1),[0],1),np.s_[1::2],0) #filter elements so that only obtain the first value of each quadrant
        ar_crude_t = np.delete(np.delete(np.delete(darray_t, np.s_[1::2], 1),[0],1),np.s_[1::2],0) #filter elements as above but for tranposed plate
        ar_fx7 = np.delete(np.delete(np.delete(darray_fx, np.s_[::2], 1),[0],1),np.s_[0::2],0) #filter elemnts for 7th fx, the 4th value of each quadrant (backwards 'C')
        ar_fx6 = np.delete(np.delete(np.delete(darray_fx, np.s_[1::2], 1),[0],1),np.s_[0::2],0)
        corr6 = (np.corrcoef(ar_crude.flatten(),ar_fx6.flatten())[0][1],np.corrcoef(ar_crude_t.flatten(),ar_fx6.flatten())[0][1])
        corr7 = (np.corrcoef(ar_crude.flatten(),ar_fx7.flatten())[0][1],np.corrcoef(ar_crude_t.flatten(),ar_fx7.flatten())[0][1])
        return (corr6,corr7)
