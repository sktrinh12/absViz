from matplotlib.backends.backend_svg import FigureCanvasSVG
from matplotlib.figure import Figure
import string
from bokeh.plotting import figure
from bokeh.models import HoverTool
import io
import numpy as np
from pymongo import MongoClient
import multiprocessing
import os

dbname = 'ncifred'
#connect_string = os.environ.get('MONGODB_KEY') for local
connect_string = f"mongodb+srv://{os.environ['MONOGO_KEY']}:{os.environ['MONOGO_SECRET']}@ncifrederick-l7ves.mongodb.net/ncifred?retryWrites=true" #for heroku
lstOfwavelengths = list(range(220,810,10))
manager = multiprocessing.Manager()
lstOfPlots = manager.list()

wellIds=[]
cnt=0
for i in range(1,17):
    for j in range(1,25):
        wellIds.append((cnt,f'{chr(64+i)}{j}'))
        cnt+=1

def chunks(l, n):
    '''takes a list and integer n as input and returns
    generator objects of n lengths from that list'''
    for i in range(0, len(l), n):
        yield l[i:i + n]

def getWavelengthData(db,pltcodeWithSuffix,wavelength):
    ''' Return dicitonary of wellids and their absorbance values '''
    res=db[pltcodeWithSuffix].find({"Wavelength":wavelength})
    return {k:v for k,v in res[0].items() if k not in ['_id','Wavelength','Temperature(¡C)']}

def getAllWellVals(db,pltcodeWithSuffix,wellID):
    lstOfVals = []
    for absnum in db[pltcodeWithSuffix].find({}, {wellID: 1 , '_id': 0}):
        lstOfVals.append(absnum[wellID ])
    return lstOfVals

def build_graph_mongo_multiproc(chunk,pltcodeWithSuffix):
    global lstOfPlots
    client=MongoClient(connect_string,maxPoolSize=10000)
    db = client[dbname]
    #loop over the id's in the chunk and do the plotting with each
    for i, wid in chunk:
        #do the plotting with document collection.find_one(id)
        img = io.BytesIO()
        fig = Figure(figsize=(0.6,0.6))
        axis = fig.add_subplot(1,1,1)
        absVals = getAllWellVals(db,pltcodeWithSuffix,wid)
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

def build_heatmap_mongo(db,wavelength,pltcodeWithSuffix):
    datadict = getWavelengthData(db,pltcodeWithSuffix,int(wavelength))
    vals=[]
    for i in db[pltcodeWithSuffix].find({}):
        for k,v in i.items():
            if k not in ['_id','Wavelength','Temperature(¡C)']:
                vals.append(v) 
    max_val = np.array(vals).max()
    min_val = abs(np.array(vals)).min()
    data_array = np.array(list(datadict.values())).reshape(16,24).T
    colourBlue = [ '#E3E6E8', '#E0E7EB', '#DEE8ED', '#DBE9F0', '#D9EAF2', '#D6EBF5', '#D4EBF7', '#D1ECFA', '#CFEDFC', '#CCEEFF', '#A8D8F0', '#A3DAF5', '#9EDBFA', '#99DDFF', '#7DC4E8', '#75C7F0', '#6EC9F7', '#66CCFF' ]
    nphist = np.linspace(min_val,max_val,num=len(colourBlue))
    lamDiff = lambda x: [abs(x-i) for i in nphist].index(min([abs(x-i) for i in nphist]))
    colours=[]
    for i in range(data_array.shape[0]):
        for j in range(data_array.shape[1]):
            if data_array[i,j] < 0:
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
    crude = list(getWavelengthData(db,pltcodeWithSuffix1,wavelength).values())
    fx = list(getWavelengthData(db,pltcodeWithSuffix2,wavelength).values())
    darray_crude = np.array(crude).reshape(16,24)
    darray_fx = np.array(fx).reshape(16,24)
    darray_t = np.flip(np.flip(darray_crude.T,axis=1),axis=0).reshape(16,24) #flip the 100 plate
    ar_crude = np.delete(np.delete(np.delete(darray_crude, np.s_[1::2], 1),[0],1),np.s_[1::2],0) #filter elements so that only obtain the first value of each quadrant
    ar_crude_t = np.delete(np.delete(np.delete(darray_t, np.s_[1::2], 1),[0],1),np.s_[1::2],0) #filter elements as above but for tranposed plate
    ar_fx7 = np.delete(np.delete(np.delete(darray_fx, np.s_[::2], 1),[0],1),np.s_[0::2],0) #filter elemnts for 7th fx
    ar_fx6 = np.delete(np.delete(np.delete(darray_fx, np.s_[1::2], 1),[0],1),np.s_[0::2],0)
    corr6 = (np.corrcoef(ar_crude.flatten(),ar_fx6.flatten())[0][1],np.corrcoef(ar_crude_t.flatten(),ar_fx6.flatten())[0][1])
    corr7 = (np.corrcoef(ar_crude.flatten(),ar_fx7.flatten())[0][1],np.corrcoef(ar_crude_t.flatten(),ar_fx7.flatten())[0][1])
    return (corr6,corr7)
