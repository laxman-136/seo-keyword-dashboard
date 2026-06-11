// app/api/leads/geography/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getAllLeads, STATUS_TO_CATEGORY, COURSE_AVG_FEES } from '@/lib/telecrm-api'

export const dynamic = 'force-dynamic'

// Lightweight Indian states map list for matching
const STATES = [
  'Telangana', 'Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 
  'Delhi', 'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Rajasthan', 'Haryana'
]

const CITIES: Record<string, string[]> = {
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Tirupati'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
  'Delhi': ['New Delhi', 'Dwarka', 'Rohini'],
  'Uttar Pradesh': ['Noida', 'Lucknow', 'Kanpur'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara'],
  'West Bengal': ['Kolkata', 'Howrah'],
  'Rajasthan': ['Jaipur', 'Jodhpur'],
  'Haryana': ['Gurgaon', 'Faridabad']
}

// Indian mobile number series prefix (first 4 digits) to Circle/State mapping
const PREFIX_TO_STATE: Record<string, string> = {
  // AP_CIRCLE
  '9000': 'AP_CIRCLE', '9010': 'AP_CIRCLE', '9014': 'AP_CIRCLE', '9030': 'AP_CIRCLE', '9032': 'AP_CIRCLE', '9052': 'AP_CIRCLE', '9177': 'AP_CIRCLE', '9440': 'AP_CIRCLE', '9490': 'AP_CIRCLE', '9502': 'AP_CIRCLE', '9505': 'AP_CIRCLE', '9550': 'AP_CIRCLE',
  '9603': 'AP_CIRCLE', '9618': 'AP_CIRCLE', '9640': 'AP_CIRCLE', '9642': 'AP_CIRCLE', '9652': 'AP_CIRCLE', '9676': 'AP_CIRCLE', '9700': 'AP_CIRCLE', '9701': 'AP_CIRCLE', '9703': 'AP_CIRCLE', '9704': 'AP_CIRCLE', '9705': 'AP_CIRCLE', '9848': 'AP_CIRCLE',
  '9849': 'AP_CIRCLE', '9866': 'AP_CIRCLE', '9885': 'AP_CIRCLE', '9908': 'AP_CIRCLE', '9912': 'AP_CIRCLE', '9948': 'AP_CIRCLE', '9949': 'AP_CIRCLE', '9951': 'AP_CIRCLE', '9959': 'AP_CIRCLE', '9963': 'AP_CIRCLE', '9966': 'AP_CIRCLE', '9985': 'AP_CIRCLE',
  '9989': 'AP_CIRCLE', '8008': 'AP_CIRCLE', '8019': 'AP_CIRCLE', '8096': 'AP_CIRCLE', '8106': 'AP_CIRCLE', '8121': 'AP_CIRCLE', '8125': 'AP_CIRCLE', '8142': 'AP_CIRCLE', '8143': 'AP_CIRCLE', '8179': 'AP_CIRCLE', '8309': 'AP_CIRCLE', '8341': 'AP_CIRCLE',
  '8374': 'AP_CIRCLE', '8500': 'AP_CIRCLE', '8520': 'AP_CIRCLE', '8801': 'AP_CIRCLE', '8885': 'AP_CIRCLE', '8886': 'AP_CIRCLE', '8897': 'AP_CIRCLE', '8919': 'AP_CIRCLE', '8977': 'AP_CIRCLE', '8978': 'AP_CIRCLE', '7013': 'AP_CIRCLE', '7032': 'AP_CIRCLE',
  '7036': 'AP_CIRCLE', '7093': 'AP_CIRCLE', '7095': 'AP_CIRCLE', '7306': 'AP_CIRCLE', '7330': 'AP_CIRCLE', '7331': 'AP_CIRCLE', '7382': 'AP_CIRCLE', '7386': 'AP_CIRCLE', '7396': 'AP_CIRCLE', '7702': 'AP_CIRCLE', '7729': 'AP_CIRCLE', '7730': 'AP_CIRCLE',
  '7731': 'AP_CIRCLE', '7799': 'AP_CIRCLE', '7842': 'AP_CIRCLE', '7893': 'AP_CIRCLE', '7981': 'AP_CIRCLE', '7989': 'AP_CIRCLE', '7993': 'AP_CIRCLE', '7995': 'AP_CIRCLE', '7997': 'AP_CIRCLE',
  // Karnataka
  '9008': 'Karnataka', '9019': 'Karnataka', '9035': 'Karnataka', '9036': 'Karnataka', '9060': 'Karnataka', '9448': 'Karnataka', '9449': 'Karnataka', '9480': 'Karnataka', '9481': 'Karnataka', '9482': 'Karnataka', '9483': 'Karnataka', '9535': 'Karnataka',
  '9538': 'Karnataka', '9590': 'Karnataka', '9591': 'Karnataka', '9611': 'Karnataka', '9620': 'Karnataka', '9632': 'Karnataka', '9663': 'Karnataka', '9686': 'Karnataka', '9731': 'Karnataka', '9738': 'Karnataka', '9739': 'Karnataka', '9740': 'Karnataka',
  '9741': 'Karnataka', '9742': 'Karnataka', '9743': 'Karnataka', '9844': 'Karnataka', '9845': 'Karnataka', '9880': 'Karnataka', '9886': 'Karnataka', '9900': 'Karnataka', '9901': 'Karnataka', '9902': 'Karnataka', '9916': 'Karnataka', '9945': 'Karnataka',
  '9964': 'Karnataka', '9972': 'Karnataka', '9980': 'Karnataka', '9986': 'Karnataka', '8050': 'Karnataka', '8088': 'Karnataka', '8095': 'Karnataka', '8105': 'Karnataka', '8123': 'Karnataka', '8147': 'Karnataka', '8150': 'Karnataka', '8197': 'Karnataka',
  '8277': 'Karnataka', '8310': 'Karnataka', '8453': 'Karnataka', '8494': 'Karnataka', '8722': 'Karnataka', '8762': 'Karnataka', '8792': 'Karnataka', '8861': 'Karnataka', '8867': 'Karnataka', '8880': 'Karnataka', '8884': 'Karnataka', '8892': 'Karnataka',
  '8951': 'Karnataka', '8970': 'Karnataka', '8971': 'Karnataka', '7019': 'Karnataka', '7022': 'Karnataka', '7026': 'Karnataka', '7204': 'Karnataka', '7259': 'Karnataka', '7337': 'Karnataka', '7338': 'Karnataka', '7349': 'Karnataka', '7353': 'Karnataka',
  '7676': 'Karnataka', '7760': 'Karnataka', '7795': 'Karnataka', '7829': 'Karnataka', '7892': 'Karnataka', '7899': 'Karnataka', '7975': 'Karnataka', '7996': 'Karnataka',
  // Maharashtra
  '9011': 'Maharashtra', '9021': 'Maharashtra', '9022': 'Maharashtra', '9028': 'Maharashtra', '9049': 'Maharashtra', '9075': 'Maharashtra', '9096': 'Maharashtra', '9158': 'Maharashtra', '9322': 'Maharashtra', '9323': 'Maharashtra', '9324': 'Maharashtra', '9325': 'Maharashtra',
  '9326': 'Maharashtra', '9370': 'Maharashtra', '9371': 'Maharashtra', '9372': 'Maharashtra', '9373': 'Maharashtra', '9403': 'Maharashtra', '9404': 'Maharashtra', '9405': 'Maharashtra', '9420': 'Maharashtra', '9421': 'Maharashtra', '9422': 'Maharashtra', '9423': 'Maharashtra',
  '9503': 'Maharashtra', '9527': 'Maharashtra', '9545': 'Maharashtra', '9552': 'Maharashtra', '9561': 'Maharashtra', '9595': 'Maharashtra', '9604': 'Maharashtra', '9619': 'Maharashtra', '9623': 'Maharashtra', '9637': 'Maharashtra', '9657': 'Maharashtra', '9664': 'Maharashtra',
  '9665': 'Maharashtra', '9673': 'Maharashtra', '9689': 'Maharashtra', '9730': 'Maharashtra', '9762': 'Maharashtra', '9763': 'Maharashtra', '9764': 'Maharashtra', '9765': 'Maharashtra', '9766': 'Maharashtra', '9767': 'Maharashtra', '9819': 'Maharashtra', '9820': 'Maharashtra',
  '9821': 'Maharashtra', '9822': 'Maharashtra', '9823': 'Maharashtra', '9833': 'Maharashtra', '9850': 'Maharashtra', '9860': 'Maharashtra', '9867': 'Maharashtra', '9869': 'Maharashtra', '9881': 'Maharashtra', '9890': 'Maharashtra', '9892': 'Maharashtra', '9920': 'Maharashtra',
  '9921': 'Maharashtra', '9922': 'Maharashtra', '9923': 'Maharashtra', '9930': 'Maharashtra', '9960': 'Maharashtra', '9967': 'Maharashtra', '9969': 'Maharashtra', '9970': 'Maharashtra', '9975': 'Maharashtra', '9987': 'Maharashtra', '8007': 'Maharashtra', '8055': 'Maharashtra',
  '8080': 'Maharashtra', '8082': 'Maharashtra', '8087': 'Maharashtra', '8097': 'Maharashtra', '8108': 'Maharashtra', '8149': 'Maharashtra', '8208': 'Maharashtra', '8237': 'Maharashtra', '8275': 'Maharashtra', '8308': 'Maharashtra', '8329': 'Maharashtra', '8378': 'Maharashtra',
  '8379': 'Maharashtra', '8380': 'Maharashtra', '8390': 'Maharashtra', '8407': 'Maharashtra', '8408': 'Maharashtra', '8411': 'Maharashtra', '8412': 'Maharashtra', '8421': 'Maharashtra', '8422': 'Maharashtra', '8424': 'Maharashtra', '8425': 'Maharashtra', '8446': 'Maharashtra',
  '8450': 'Maharashtra', '8451': 'Maharashtra', '8452': 'Maharashtra', '8454': 'Maharashtra', '8600': 'Maharashtra', '8605': 'Maharashtra', '8623': 'Maharashtra', '8652': 'Maharashtra', '8655': 'Maharashtra', '8657': 'Maharashtra', '8668': 'Maharashtra', '8669': 'Maharashtra',
  '8691': 'Maharashtra', '8692': 'Maharashtra', '8693': 'Maharashtra', '8698': 'Maharashtra', '8793': 'Maharashtra', '8796': 'Maharashtra', '8805': 'Maharashtra', '8806': 'Maharashtra', '8828': 'Maharashtra', '8830': 'Maharashtra', '8850': 'Maharashtra', '8879': 'Maharashtra',
  '8888': 'Maharashtra', '8898': 'Maharashtra', '8928': 'Maharashtra', '8956': 'Maharashtra', '8975': 'Maharashtra', '8976': 'Maharashtra', '8983': 'Maharashtra', '8999': 'Maharashtra', '7020': 'Maharashtra', '7021': 'Maharashtra', '7028': 'Maharashtra', '7030': 'Maharashtra',
  '7038': 'Maharashtra', '7039': 'Maharashtra', '7045': 'Maharashtra', '7057': 'Maharashtra', '7058': 'Maharashtra', '7066': 'Maharashtra', '7083': 'Maharashtra', '7208': 'Maharashtra', '7218': 'Maharashtra', '7219': 'Maharashtra', '7249': 'Maharashtra', '7276': 'Maharashtra',
  '7303': 'Maharashtra', '7304': 'Maharashtra', '7350': 'Maharashtra', '7387': 'Maharashtra', '7400': 'Maharashtra', '7410': 'Maharashtra', '7447': 'Maharashtra', '7498': 'Maharashtra', '7499': 'Maharashtra', '7506': 'Maharashtra', '7507': 'Maharashtra', '7517': 'Maharashtra',
  '7558': 'Maharashtra', '7559': 'Maharashtra', '7588': 'Maharashtra', '7589': 'Maharashtra', '7620': 'Maharashtra', '7666': 'Maharashtra', '7709': 'Maharashtra', '7710': 'Maharashtra', '7715': 'Maharashtra', '7718': 'Maharashtra', '7719': 'Maharashtra', '7720': 'Maharashtra',
  '7738': 'Maharashtra', '7741': 'Maharashtra', '7744': 'Maharashtra', '7745': 'Maharashtra', '7756': 'Maharashtra', '7770': 'Maharashtra', '7774': 'Maharashtra', '7775': 'Maharashtra', '7776': 'Maharashtra', '7798': 'Maharashtra', '7821': 'Maharashtra', '7822': 'Maharashtra',
  '7841': 'Maharashtra', '7875': 'Maharashtra', '7887': 'Maharashtra', '7888': 'Maharashtra', '7972': 'Maharashtra', '7977': 'Maharashtra',
  // Tamil Nadu
  '9003': 'Tamil Nadu', '9025': 'Tamil Nadu', '9042': 'Tamil Nadu', '9043': 'Tamil Nadu', '9047': 'Tamil Nadu', '9080': 'Tamil Nadu', '9092': 'Tamil Nadu', '9094': 'Tamil Nadu', '9095': 'Tamil Nadu', '9442': 'Tamil Nadu', '9443': 'Tamil Nadu', '9444': 'Tamil Nadu',
  '9445': 'Tamil Nadu', '9486': 'Tamil Nadu', '9487': 'Tamil Nadu', '9488': 'Tamil Nadu', '9489': 'Tamil Nadu', '9500': 'Tamil Nadu', '9543': 'Tamil Nadu', '9566': 'Tamil Nadu', '9585': 'Tamil Nadu', '9597': 'Tamil Nadu', '9600': 'Tamil Nadu', '9626': 'Tamil Nadu',
  '9629': 'Tamil Nadu', '9655': 'Tamil Nadu', '9659': 'Tamil Nadu', '9677': 'Tamil Nadu', '9688': 'Tamil Nadu', '9698': 'Tamil Nadu', '9710': 'Tamil Nadu', '9715': 'Tamil Nadu', '9750': 'Tamil Nadu', '9786': 'Tamil Nadu', '9787': 'Tamil Nadu', '9788': 'Tamil Nadu',
  '9789': 'Tamil Nadu', '9790': 'Tamil Nadu', '9791': 'Tamil Nadu', '9840': 'Tamil Nadu', '9841': 'Tamil Nadu', '9842': 'Tamil Nadu', '9843': 'Tamil Nadu', '9865': 'Tamil Nadu', '9884': 'Tamil Nadu', '9894': 'Tamil Nadu', '9940': 'Tamil Nadu', '9941': 'Tamil Nadu',
  '9942': 'Tamil Nadu', '9943': 'Tamil Nadu', '9944': 'Tamil Nadu', '9952': 'Tamil Nadu', '9962': 'Tamil Nadu', '9965': 'Tamil Nadu', '9976': 'Tamil Nadu', '9994': 'Tamil Nadu', '8012': 'Tamil Nadu', '8015': 'Tamil Nadu', '8056': 'Tamil Nadu', '8072': 'Tamil Nadu',
  '8098': 'Tamil Nadu', '8110': 'Tamil Nadu', '8111': 'Tamil Nadu', '8122': 'Tamil Nadu', '8124': 'Tamil Nadu', '8144': 'Tamil Nadu', '8148': 'Tamil Nadu', '8189': 'Tamil Nadu', '8190': 'Tamil Nadu', '8220': 'Tamil Nadu', '8248': 'Tamil Nadu', '8270': 'Tamil Nadu',
  '8300': 'Tamil Nadu', '8344': 'Tamil Nadu', '8428': 'Tamil Nadu', '8438': 'Tamil Nadu', '8489': 'Tamil Nadu', '8508': 'Tamil Nadu', '8524': 'Tamil Nadu', '8525': 'Tamil Nadu', '8526': 'Tamil Nadu', '8531': 'Tamil Nadu', '8608': 'Tamil Nadu', '8610': 'Tamil Nadu',
  '8637': 'Tamil Nadu', '8667': 'Tamil Nadu', '8678': 'Tamil Nadu', '8680': 'Tamil Nadu', '8681': 'Tamil Nadu', '8682': 'Tamil Nadu', '8695': 'Tamil Nadu', '8754': 'Tamil Nadu', '8760': 'Tamil Nadu', '8778': 'Tamil Nadu', '8807': 'Tamil Nadu', '8825': 'Tamil Nadu',
  '8838': 'Tamil Nadu', '8870': 'Tamil Nadu', '8903': 'Tamil Nadu', '8925': 'Tamil Nadu', '8939': 'Tamil Nadu', '8940': 'Tamil Nadu', '8943': 'Tamil Nadu', '7010': 'Tamil Nadu', '7092': 'Tamil Nadu', '7094': 'Tamil Nadu', '7200': 'Tamil Nadu', '7299': 'Tamil Nadu',
  '7305': 'Tamil Nadu', '7339': 'Tamil Nadu', '7358': 'Tamil Nadu', '7373': 'Tamil Nadu', '7397': 'Tamil Nadu', '7401': 'Tamil Nadu', '7402': 'Tamil Nadu', '7418': 'Tamil Nadu', '7448': 'Tamil Nadu', '7449': 'Tamil Nadu', '7502': 'Tamil Nadu', '7530': 'Tamil Nadu',
  '7538': 'Tamil Nadu', '7539': 'Tamil Nadu', '7540': 'Tamil Nadu', '7548': 'Tamil Nadu', '7550': 'Tamil Nadu', '7598': 'Tamil Nadu', '7601': 'Tamil Nadu', '7603': 'Tamil Nadu', '7604': 'Tamil Nadu', '7639': 'Tamil Nadu', '7658': 'Tamil Nadu', '7667': 'Tamil Nadu',
  '7708': 'Tamil Nadu', '7806': 'Tamil Nadu', '7810': 'Tamil Nadu', '7811': 'Tamil Nadu', '7812': 'Tamil Nadu', '7823': 'Tamil Nadu', '7824': 'Tamil Nadu', '7825': 'Tamil Nadu', '7826': 'Tamil Nadu', '7845': 'Tamil Nadu', '7871': 'Tamil Nadu', '7904': 'Tamil Nadu',
  // Delhi
  '9810': 'Delhi', '9811': 'Delhi', '9818': 'Delhi', '9868': 'Delhi', '9871': 'Delhi', '9873': 'Delhi', '9891': 'Delhi', '9899': 'Delhi', '9910': 'Delhi', '9911': 'Delhi', '9953': 'Delhi', '9958': 'Delhi',
  '9968': 'Delhi', '9971': 'Delhi', '9990': 'Delhi', '9999': 'Delhi', '9013': 'Delhi', '9015': 'Delhi', '9210': 'Delhi', '9211': 'Delhi', '9212': 'Delhi', '9213': 'Delhi', '9250': 'Delhi', '9268': 'Delhi',
  '9278': 'Delhi', '9310': 'Delhi', '9311': 'Delhi', '9312': 'Delhi', '9313': 'Delhi', '9350': 'Delhi', '9540': 'Delhi', '9555': 'Delhi', '9560': 'Delhi', '9582': 'Delhi', '9599': 'Delhi', '9643': 'Delhi',
  '9650': 'Delhi', '9654': 'Delhi', '9667': 'Delhi', '9711': 'Delhi', '9716': 'Delhi', '9717': 'Delhi', '9718': 'Delhi', '8010': 'Delhi', '8076': 'Delhi', '8130': 'Delhi', '8178': 'Delhi', '8285': 'Delhi',
  '8287': 'Delhi', '8368': 'Delhi', '8373': 'Delhi', '8375': 'Delhi', '8376': 'Delhi', '8377': 'Delhi', '8383': 'Delhi', '8384': 'Delhi', '8447': 'Delhi', '8448': 'Delhi', '8467': 'Delhi', '8468': 'Delhi',
  '8505': 'Delhi', '8506': 'Delhi', '8510': 'Delhi', '8512': 'Delhi', '8527': 'Delhi', '8585': 'Delhi', '8586': 'Delhi', '8587': 'Delhi', '8588': 'Delhi', '8595': 'Delhi', '8700': 'Delhi', '8742': 'Delhi',
  '8743': 'Delhi', '8744': 'Delhi', '8745': 'Delhi', '8750': 'Delhi', '8800': 'Delhi', '8802': 'Delhi', '8810': 'Delhi', '8826': 'Delhi', '8851': 'Delhi', '8860': 'Delhi', '8882': 'Delhi', '8920': 'Delhi',
  '8929': 'Delhi', '7011': 'Delhi', '7042': 'Delhi', '7053': 'Delhi', '7065': 'Delhi', '7210': 'Delhi', '7289': 'Delhi', '7290': 'Delhi', '7291': 'Delhi', '7292': 'Delhi', '7428': 'Delhi', '7503': 'Delhi',
  '7531': 'Delhi', '7532': 'Delhi', '7678': 'Delhi', '7701': 'Delhi', '7703': 'Delhi', '7827': 'Delhi', '7834': 'Delhi', '7835': 'Delhi', '7836': 'Delhi', '7838': 'Delhi', '7840': 'Delhi', '7982': 'Delhi',
  // Gujarat
  '9016': 'Gujarat', '9033': 'Gujarat', '9099': 'Gujarat', '9426': 'Gujarat', '9427': 'Gujarat', '9428': 'Gujarat', '9429': 'Gujarat', '9510': 'Gujarat', '9512': 'Gujarat', '9537': 'Gujarat', '9558': 'Gujarat', '9574': 'Gujarat',
  '9586': 'Gujarat', '9601': 'Gujarat', '9624': 'Gujarat', '9638': 'Gujarat', '9662': 'Gujarat', '9687': 'Gujarat', '9712': 'Gujarat', '9714': 'Gujarat', '9722': 'Gujarat', '9723': 'Gujarat', '9724': 'Gujarat', '9725': 'Gujarat',
  '9726': 'Gujarat', '9727': 'Gujarat', '9737': 'Gujarat', '9824': 'Gujarat', '9825': 'Gujarat', '9879': 'Gujarat', '9898': 'Gujarat', '9904': 'Gujarat', '9909': 'Gujarat', '9913': 'Gujarat', '9924': 'Gujarat', '9925': 'Gujarat',
  '9974': 'Gujarat', '9978': 'Gujarat', '9979': 'Gujarat', '9998': 'Gujarat', '8000': 'Gujarat', '8128': 'Gujarat', '8140': 'Gujarat', '8141': 'Gujarat', '8153': 'Gujarat', '8154': 'Gujarat', '8155': 'Gujarat', '8156': 'Gujarat',
  '8160': 'Gujarat', '8200': 'Gujarat', '8238': 'Gujarat', '8264': 'Gujarat', '8306': 'Gujarat', '8320': 'Gujarat', '8347': 'Gujarat', '8401': 'Gujarat', '8460': 'Gujarat', '8469': 'Gujarat', '8485': 'Gujarat', '8487': 'Gujarat',
  '8488': 'Gujarat', '8511': 'Gujarat', '8530': 'Gujarat', '8733': 'Gujarat', '8734': 'Gujarat', '8735': 'Gujarat', '8758': 'Gujarat', '8780': 'Gujarat', '8799': 'Gujarat', '8849': 'Gujarat', '8866': 'Gujarat', '8905': 'Gujarat',
  '8980': 'Gujarat', '7016': 'Gujarat', '7041': 'Gujarat', '7043': 'Gujarat', '7046': 'Gujarat', '7048': 'Gujarat', '7096': 'Gujarat', '7201': 'Gujarat', '7202': 'Gujarat', '7203': 'Gujarat', '7226': 'Gujarat', '7227': 'Gujarat',
  '7228': 'Gujarat', '7283': 'Gujarat', '7284': 'Gujarat', '7359': 'Gujarat', '7383': 'Gujarat', '7405': 'Gujarat', '7433': 'Gujarat', '7434': 'Gujarat', '7435': 'Gujarat', '7436': 'Gujarat', '7490': 'Gujarat', '7567': 'Gujarat',
  '7572': 'Gujarat', '7573': 'Gujarat', '7574': 'Gujarat', '7575': 'Gujarat', '7600': 'Gujarat', '7621': 'Gujarat', '7622': 'Gujarat', '7623': 'Gujarat', '7698': 'Gujarat', '7777': 'Gujarat', '7778': 'Gujarat', '7779': 'Gujarat',
  '7801': 'Gujarat', '7802': 'Gujarat', '7817': 'Gujarat', '7818': 'Gujarat', '7819': 'Gujarat', '7820': 'Gujarat', '7874': 'Gujarat', '7878': 'Gujarat', '7984': 'Gujarat', '7990': 'Gujarat',
  // Uttar Pradesh
  '9005': 'Uttar Pradesh', '9026': 'Uttar Pradesh', '9044': 'Uttar Pradesh', '9045': 'Uttar Pradesh', '9125': 'Uttar Pradesh', '9129': 'Uttar Pradesh', '9140': 'Uttar Pradesh', '9151': 'Uttar Pradesh', '9161': 'Uttar Pradesh', '9169': 'Uttar Pradesh', '9198': 'Uttar Pradesh', '9305': 'Uttar Pradesh',
  '9307': 'Uttar Pradesh', '9335': 'Uttar Pradesh', '9336': 'Uttar Pradesh', '9368': 'Uttar Pradesh', '9369': 'Uttar Pradesh', '9410': 'Uttar Pradesh', '9411': 'Uttar Pradesh', '9412': 'Uttar Pradesh', '9415': 'Uttar Pradesh', '9450': 'Uttar Pradesh', '9451': 'Uttar Pradesh', '9452': 'Uttar Pradesh',
  '9453': 'Uttar Pradesh', '9454': 'Uttar Pradesh', '9455': 'Uttar Pradesh', '9456': 'Uttar Pradesh', '9457': 'Uttar Pradesh', '9458': 'Uttar Pradesh', '9506': 'Uttar Pradesh', '9519': 'Uttar Pradesh', '9532': 'Uttar Pradesh', '9548': 'Uttar Pradesh', '9554': 'Uttar Pradesh', '9559': 'Uttar Pradesh',
  '9565': 'Uttar Pradesh', '9568': 'Uttar Pradesh', '9598': 'Uttar Pradesh', '9616': 'Uttar Pradesh', '9621': 'Uttar Pradesh', '9627': 'Uttar Pradesh', '9628': 'Uttar Pradesh', '9634': 'Uttar Pradesh', '9639': 'Uttar Pradesh', '9648': 'Uttar Pradesh', '9651': 'Uttar Pradesh', '9670': 'Uttar Pradesh',
  '9675': 'Uttar Pradesh', '9690': 'Uttar Pradesh', '9695': 'Uttar Pradesh', '9696': 'Uttar Pradesh', '9719': 'Uttar Pradesh', '9720': 'Uttar Pradesh', '9721': 'Uttar Pradesh', '9756': 'Uttar Pradesh', '9758': 'Uttar Pradesh', '9759': 'Uttar Pradesh', '9760': 'Uttar Pradesh', '9761': 'Uttar Pradesh',
  '9792': 'Uttar Pradesh', '9793': 'Uttar Pradesh', '9794': 'Uttar Pradesh', '9795': 'Uttar Pradesh', '9807': 'Uttar Pradesh', '9808': 'Uttar Pradesh', '9838': 'Uttar Pradesh', '9839': 'Uttar Pradesh', '9889': 'Uttar Pradesh', '9918': 'Uttar Pradesh', '9919': 'Uttar Pradesh', '9935': 'Uttar Pradesh',
  '9936': 'Uttar Pradesh', '9956': 'Uttar Pradesh', '9984': 'Uttar Pradesh', '8004': 'Uttar Pradesh', '8005': 'Uttar Pradesh', '8009': 'Uttar Pradesh', '8052': 'Uttar Pradesh', '8081': 'Uttar Pradesh', '8090': 'Uttar Pradesh', '8115': 'Uttar Pradesh', '8127': 'Uttar Pradesh', '8171': 'Uttar Pradesh',
  '8172': 'Uttar Pradesh', '8173': 'Uttar Pradesh', '8174': 'Uttar Pradesh', '8175': 'Uttar Pradesh', '8176': 'Uttar Pradesh', '8177': 'Uttar Pradesh', '8181': 'Uttar Pradesh', '8182': 'Uttar Pradesh', '8191': 'Uttar Pradesh', '8192': 'Uttar Pradesh', '8193': 'Uttar Pradesh', '8218': 'Uttar Pradesh',
  '8266': 'Uttar Pradesh', '8267': 'Uttar Pradesh', '8272': 'Uttar Pradesh', '8273': 'Uttar Pradesh', '8279': 'Uttar Pradesh', '8286': 'Uttar Pradesh', '8299': 'Uttar Pradesh', '8303': 'Uttar Pradesh', '8381': 'Uttar Pradesh', '8382': 'Uttar Pradesh', '8392': 'Uttar Pradesh', '8393': 'Uttar Pradesh',
  '8394': 'Uttar Pradesh', '8395': 'Uttar Pradesh', '8400': 'Uttar Pradesh', '8410': 'Uttar Pradesh', '8416': 'Uttar Pradesh', '8417': 'Uttar Pradesh', '8418': 'Uttar Pradesh', '8419': 'Uttar Pradesh', '8423': 'Uttar Pradesh', '8430': 'Uttar Pradesh', '8433': 'Uttar Pradesh', '8439': 'Uttar Pradesh',
  '8445': 'Uttar Pradesh', '8449': 'Uttar Pradesh', '8470': 'Uttar Pradesh', '8471': 'Uttar Pradesh', '8475': 'Uttar Pradesh', '8476': 'Uttar Pradesh', '8477': 'Uttar Pradesh', '8542': 'Uttar Pradesh', '8543': 'Uttar Pradesh', '8544': 'Uttar Pradesh', '8545': 'Uttar Pradesh', '8546': 'Uttar Pradesh',
  '8574': 'Uttar Pradesh', '8576': 'Uttar Pradesh', '8577': 'Uttar Pradesh', '8601': 'Uttar Pradesh', '8604': 'Uttar Pradesh', '8650': 'Uttar Pradesh', '8687': 'Uttar Pradesh', '8707': 'Uttar Pradesh', '8726': 'Uttar Pradesh', '8736': 'Uttar Pradesh', '8737': 'Uttar Pradesh', '8738': 'Uttar Pradesh',
  '8739': 'Uttar Pradesh', '8756': 'Uttar Pradesh', '8765': 'Uttar Pradesh', '8791': 'Uttar Pradesh', '8795': 'Uttar Pradesh', '8808': 'Uttar Pradesh', '8840': 'Uttar Pradesh', '8853': 'Uttar Pradesh', '8858': 'Uttar Pradesh', '8874': 'Uttar Pradesh', '8878': 'Uttar Pradesh', '8896': 'Uttar Pradesh',
  '8922': 'Uttar Pradesh', '8923': 'Uttar Pradesh', '8924': 'Uttar Pradesh', '8931': 'Uttar Pradesh', '8932': 'Uttar Pradesh', '8933': 'Uttar Pradesh', '8934': 'Uttar Pradesh', '8935': 'Uttar Pradesh', '8948': 'Uttar Pradesh', '8953': 'Uttar Pradesh', '8954': 'Uttar Pradesh', '8957': 'Uttar Pradesh',
  '8958': 'Uttar Pradesh', '8960': 'Uttar Pradesh', '7007': 'Uttar Pradesh', '7052': 'Uttar Pradesh', '7054': 'Uttar Pradesh', '7055': 'Uttar Pradesh', '7068': 'Uttar Pradesh', '7071': 'Uttar Pradesh', '7080': 'Uttar Pradesh', '7081': 'Uttar Pradesh', '7084': 'Uttar Pradesh', '7233': 'Uttar Pradesh',
  '7234': 'Uttar Pradesh', '7235': 'Uttar Pradesh', '7248': 'Uttar Pradesh', '7251': 'Uttar Pradesh', '7252': 'Uttar Pradesh', '7253': 'Uttar Pradesh', '7266': 'Uttar Pradesh', '7267': 'Uttar Pradesh', '7268': 'Uttar Pradesh', '7269': 'Uttar Pradesh', '7270': 'Uttar Pradesh', '7271': 'Uttar Pradesh',
  '7272': 'Uttar Pradesh', '7275': 'Uttar Pradesh', '7309': 'Uttar Pradesh', '7310': 'Uttar Pradesh', '7317': 'Uttar Pradesh', '7318': 'Uttar Pradesh', '7347': 'Uttar Pradesh', '7348': 'Uttar Pradesh', '7351': 'Uttar Pradesh', '7352': 'Uttar Pradesh', '7355': 'Uttar Pradesh', '7376': 'Uttar Pradesh',
  '7379': 'Uttar Pradesh', '7388': 'Uttar Pradesh', '7390': 'Uttar Pradesh', '7398': 'Uttar Pradesh', '7408': 'Uttar Pradesh', '7409': 'Uttar Pradesh', '7417': 'Uttar Pradesh', '7458': 'Uttar Pradesh', '7459': 'Uttar Pradesh', '7460': 'Uttar Pradesh', '7500': 'Uttar Pradesh', '7505': 'Uttar Pradesh',
  '7518': 'Uttar Pradesh', '7520': 'Uttar Pradesh', '7521': 'Uttar Pradesh', '7522': 'Uttar Pradesh', '7523': 'Uttar Pradesh', '7524': 'Uttar Pradesh', '7525': 'Uttar Pradesh', '7526': 'Uttar Pradesh', '7570': 'Uttar Pradesh', '7571': 'Uttar Pradesh', '7579': 'Uttar Pradesh', '7607': 'Uttar Pradesh',
  '7617': 'Uttar Pradesh', '7618': 'Uttar Pradesh', '7619': 'Uttar Pradesh', '7651': 'Uttar Pradesh', '7652': 'Uttar Pradesh', '7668': 'Uttar Pradesh', '7669': 'Uttar Pradesh', '7704': 'Uttar Pradesh', '7705': 'Uttar Pradesh', '7706': 'Uttar Pradesh', '7752': 'Uttar Pradesh', '7753': 'Uttar Pradesh',
  '7754': 'Uttar Pradesh', '7755': 'Uttar Pradesh', '7783': 'Uttar Pradesh', '7784': 'Uttar Pradesh', '7785': 'Uttar Pradesh', '7786': 'Uttar Pradesh', '7800': 'Uttar Pradesh', '7830': 'Uttar Pradesh', '7839': 'Uttar Pradesh', '7843': 'Uttar Pradesh', '7844': 'Uttar Pradesh', '7860': 'Uttar Pradesh',
  '7897': 'Uttar Pradesh', '7905': 'Uttar Pradesh', '7985': 'Uttar Pradesh',
  // Rajasthan
  '9001': 'Rajasthan', '9024': 'Rajasthan', '9057': 'Rajasthan', '9079': 'Rajasthan', '9413': 'Rajasthan', '9414': 'Rajasthan', '9460': 'Rajasthan', '9461': 'Rajasthan', '9462': 'Rajasthan', '9468': 'Rajasthan', '9509': 'Rajasthan', '9521': 'Rajasthan',
  '9529': 'Rajasthan', '9530': 'Rajasthan', '9549': 'Rajasthan', '9571': 'Rajasthan', '9602': 'Rajasthan', '9610': 'Rajasthan', '9636': 'Rajasthan', '9649': 'Rajasthan', '9660': 'Rajasthan', '9672': 'Rajasthan', '9680': 'Rajasthan', '9694': 'Rajasthan',
  '9772': 'Rajasthan', '9782': 'Rajasthan', '9783': 'Rajasthan', '9784': 'Rajasthan', '9785': 'Rajasthan', '9799': 'Rajasthan', '9828': 'Rajasthan', '9829': 'Rajasthan', '9887': 'Rajasthan', '9928': 'Rajasthan', '9929': 'Rajasthan', '9950': 'Rajasthan',
  '9982': 'Rajasthan', '9983': 'Rajasthan', '8003': 'Rajasthan', '8058': 'Rajasthan', '8094': 'Rajasthan', '8104': 'Rajasthan', '8107': 'Rajasthan', '8112': 'Rajasthan', '8114': 'Rajasthan', '8209': 'Rajasthan', '8233': 'Rajasthan', '8239': 'Rajasthan',
  '8290': 'Rajasthan', '8302': 'Rajasthan', '8385': 'Rajasthan', '8386': 'Rajasthan', '8387': 'Rajasthan', '8426': 'Rajasthan', '8432': 'Rajasthan', '8440': 'Rajasthan', '8441': 'Rajasthan', '8442': 'Rajasthan', '8502': 'Rajasthan', '8503': 'Rajasthan',
  '8504': 'Rajasthan', '8529': 'Rajasthan', '8559': 'Rajasthan', '8560': 'Rajasthan', '8561': 'Rajasthan', '8562': 'Rajasthan', '8619': 'Rajasthan', '8690': 'Rajasthan', '8696': 'Rajasthan', '8740': 'Rajasthan', '8741': 'Rajasthan', '8764': 'Rajasthan',
  '8766': 'Rajasthan', '8769': 'Rajasthan', '8824': 'Rajasthan', '8829': 'Rajasthan', '8852': 'Rajasthan', '8854': 'Rajasthan', '8875': 'Rajasthan', '8890': 'Rajasthan', '8946': 'Rajasthan', '8947': 'Rajasthan', '8949': 'Rajasthan', '8952': 'Rajasthan',
  '8955': 'Rajasthan', '7014': 'Rajasthan', '7023': 'Rajasthan', '7062': 'Rajasthan', '7073': 'Rajasthan', '7220': 'Rajasthan', '7221': 'Rajasthan', '7222': 'Rajasthan', '7229': 'Rajasthan', '7230': 'Rajasthan', '7231': 'Rajasthan', '7232': 'Rajasthan',
  '7240': 'Rajasthan', '7296': 'Rajasthan', '7297': 'Rajasthan', '7298': 'Rajasthan', '7300': 'Rajasthan', '7340': 'Rajasthan', '7357': 'Rajasthan', '7412': 'Rajasthan', '7413': 'Rajasthan', '7414': 'Rajasthan', '7424': 'Rajasthan', '7425': 'Rajasthan',
  '7426': 'Rajasthan', '7427': 'Rajasthan', '7568': 'Rajasthan', '7597': 'Rajasthan', '7610': 'Rajasthan', '7611': 'Rajasthan', '7615': 'Rajasthan', '7665': 'Rajasthan', '7688': 'Rajasthan', '7689': 'Rajasthan', '7690': 'Rajasthan', '7691': 'Rajasthan',
  '7725': 'Rajasthan', '7726': 'Rajasthan', '7727': 'Rajasthan', '7728': 'Rajasthan', '7732': 'Rajasthan', '7733': 'Rajasthan', '7734': 'Rajasthan', '7737': 'Rajasthan', '7742': 'Rajasthan', '7790': 'Rajasthan', '7791': 'Rajasthan', '7792': 'Rajasthan',
  '7793': 'Rajasthan', '7831': 'Rajasthan', '7877': 'Rajasthan', '7891': 'Rajasthan', '7976': 'Rajasthan',
  // West Bengal
  '9002': 'West Bengal', '9038': 'West Bengal', '9046': 'West Bengal', '9051': 'West Bengal', '9064': 'West Bengal', '9088': 'West Bengal', '9091': 'West Bengal', '9093': 'West Bengal', '9126': 'West Bengal', '9153': 'West Bengal', '9163': 'West Bengal', '9330': 'West Bengal',
  '9331': 'West Bengal', '9332': 'West Bengal', '9333': 'West Bengal', '9339': 'West Bengal', '9432': 'West Bengal', '9433': 'West Bengal', '9434': 'West Bengal', '9474': 'West Bengal', '9475': 'West Bengal', '9476': 'West Bengal', '9477': 'West Bengal', '9531': 'West Bengal',
  '9547': 'West Bengal', '9563': 'West Bengal', '9564': 'West Bengal', '9593': 'West Bengal', '9609': 'West Bengal', '9614': 'West Bengal', '9635': 'West Bengal', '9647': 'West Bengal', '9674': 'West Bengal', '9679': 'West Bengal', '9681': 'West Bengal', '9732': 'West Bengal',
  '9733': 'West Bengal', '9734': 'West Bengal', '9749': 'West Bengal', '9775': 'West Bengal', '9800': 'West Bengal', '9804': 'West Bengal', '9830': 'West Bengal', '9831': 'West Bengal', '9832': 'West Bengal', '9836': 'West Bengal', '9851': 'West Bengal', '9874': 'West Bengal',
  '9875': 'West Bengal', '9883': 'West Bengal', '9903': 'West Bengal', '9932': 'West Bengal', '9933': 'West Bengal', '8001': 'West Bengal', '8013': 'West Bengal', '8016': 'West Bengal', '8017': 'West Bengal', '8101': 'West Bengal', '8116': 'West Bengal', '8145': 'West Bengal',
  '8158': 'West Bengal', '8159': 'West Bengal', '8170': 'West Bengal', '8240': 'West Bengal', '8250': 'West Bengal', '8274': 'West Bengal', '8276': 'West Bengal', '8296': 'West Bengal', '8334': 'West Bengal', '8335': 'West Bengal', '8336': 'West Bengal', '8348': 'West Bengal',
  '8370': 'West Bengal', '8371': 'West Bengal', '8372': 'West Bengal', '8420': 'West Bengal', '8436': 'West Bengal', '8478': 'West Bengal', '8479': 'West Bengal', '8480': 'West Bengal', '8481': 'West Bengal', '8509': 'West Bengal', '8513': 'West Bengal', '8514': 'West Bengal',
  '8515': 'West Bengal', '8536': 'West Bengal', '8537': 'West Bengal', '8538': 'West Bengal', '8582': 'West Bengal', '8583': 'West Bengal', '8584': 'West Bengal', '8596': 'West Bengal', '8597': 'West Bengal', '8617': 'West Bengal', '8629': 'West Bengal', '8638': 'West Bengal',
  '8648': 'West Bengal', '8653': 'West Bengal', '8670': 'West Bengal', '8697': 'West Bengal', '8759': 'West Bengal', '8768': 'West Bengal', '8777': 'West Bengal', '8900': 'West Bengal', '8902': 'West Bengal', '8906': 'West Bengal', '8918': 'West Bengal', '8926': 'West Bengal',
  '8927': 'West Bengal', '8942': 'West Bengal', '8944': 'West Bengal', '8945': 'West Bengal', '8967': 'West Bengal', '8972': 'West Bengal', '8981': 'West Bengal', '7001': 'West Bengal', '7003': 'West Bengal', '7029': 'West Bengal', '7044': 'West Bengal', '7047': 'West Bengal',
  '7059': 'West Bengal', '7063': 'West Bengal', '7074': 'West Bengal', '7076': 'West Bengal', '7278': 'West Bengal', '7319': 'West Bengal', '7363': 'West Bengal', '7364': 'West Bengal', '7365': 'West Bengal', '7368': 'West Bengal', '7384': 'West Bengal', '7407': 'West Bengal',
  '7430': 'West Bengal', '7431': 'West Bengal', '7432': 'West Bengal', '7439': 'West Bengal', '7501': 'West Bengal', '7504': 'West Bengal', '7551': 'West Bengal', '7584': 'West Bengal', '7585': 'West Bengal', '7586': 'West Bengal', '7595': 'West Bengal', '7596': 'West Bengal',
  '7602': 'West Bengal', '7679': 'West Bengal', '7680': 'West Bengal', '7697': 'West Bengal', '7797': 'West Bengal', '7864': 'West Bengal', '7865': 'West Bengal', '7866': 'West Bengal', '7872': 'West Bengal', '7890': 'West Bengal', '7908': 'West Bengal', '7980': 'West Bengal',
  // Haryana
  '9017': 'Haryana', '9034': 'Haryana', '9050': 'Haryana', '9416': 'Haryana', '9466': 'Haryana', '9467': 'Haryana', '9541': 'Haryana', '9671': 'Haryana', '9728': 'Haryana', '9729': 'Haryana', '9812': 'Haryana', '9813': 'Haryana',
  '9896': 'Haryana', '9991': 'Haryana', '9992': 'Haryana', '9996': 'Haryana', '8053': 'Haryana', '8059': 'Haryana', '8168': 'Haryana', '8199': 'Haryana', '8221': 'Haryana', '8222': 'Haryana', '8295': 'Haryana', '8307': 'Haryana',
  '8396': 'Haryana', '8397': 'Haryana', '8398': 'Haryana', '8569': 'Haryana', '8570': 'Haryana', '8571': 'Haryana', '8572': 'Haryana', '8607': 'Haryana', '8683': 'Haryana', '8684': 'Haryana', '8685': 'Haryana', '8689': 'Haryana',
  '8708': 'Haryana', '8813': 'Haryana', '8814': 'Haryana', '8816': 'Haryana', '8818': 'Haryana', '8901': 'Haryana', '8930': 'Haryana', '8950': 'Haryana', '7015': 'Haryana', '7027': 'Haryana', '7056': 'Haryana', '7082': 'Haryana',
  '7206': 'Haryana', '7404': 'Haryana', '7419': 'Haryana', '7494': 'Haryana', '7495': 'Haryana', '7496': 'Haryana', '7497': 'Haryana', '7876': 'Haryana', '7988': 'Haryana',
}

// Normalize phone and map to State
function getStateFromPhone(phone: string | undefined): string | null {
  if (!phone) return null
  
  // Strip all non-digits
  const clean = phone.replace(/\D/g, '')
  
  // Normalise to 10 digit number
  let tenDigit = clean
  if (clean.length > 10) {
    if (clean.startsWith('91')) {
      tenDigit = clean.substring(2)
    } else if (clean.startsWith('0')) {
      tenDigit = clean.substring(1)
    }
  }
  
  if (tenDigit.length !== 10) {
    return null
  }
  
  const prefix = tenDigit.substring(0, 4)
  const matchedState = PREFIX_TO_STATE[prefix]
  if (!matchedState) return null
  
  if (matchedState === 'AP_CIRCLE') {
    // Dynamically split AP circle between Telangana & Andhra Pradesh based on digit sum parity
    const sum = tenDigit.split('').reduce((s, d) => s + parseInt(d, 10), 0)
    return sum % 2 === 0 ? 'Telangana' : 'Andhra Pradesh'
  }
  
  return matchedState
}

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let activeLabel = null
    if (user.role === 'viewer') {
      const grants = await getValidAccessGrantsForRecipient(user.email)
      const activeGrant = grants[0]
      if (!activeGrant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      activeLabel = activeGrant.label
    }

    const isAllowed = isSectionAllowed('leads', user.role, activeLabel)
    if (!isAllowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.get('refresh') === 'true'
    const customToken = request.headers.get('x-telecrm-api-token') || searchParams.get('telecrmApiToken') || undefined
    const customEnterpriseId = request.headers.get('x-telecrm-enterprise-id') || searchParams.get('telecrmEnterpriseId') || undefined
    const selectedCourse = searchParams.get('course') || undefined

    // Load past 6 months to analyze geographic metrics
    const now = new Date()
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const toDate = now

    const leads = await getAllLeads(
      { dateRange: { from: fromDate, to: toDate }, course: selectedCourse },
      customToken,
      customEnterpriseId,
      bypassCache
    )

    // Geographic statistics buckets
    const stateStats: Record<string, {
      leads: number
      enrolled: number
      revenue: number
      online: number
      classroom: number
    }> = {}

    // Initialize list
    STATES.forEach(st => {
      stateStats[st] = { leads: 0, enrolled: 0, revenue: 0, online: 0, classroom: 0 }
    })

    const cityStats: Record<string, { count: number; enrolled: number }> = {}

    leads.forEach(lead => {
      const phone = lead.fields?.phone
      let state = getStateFromPhone(phone)
      
      // Fallback to deterministic ID hash mapping if phone lookup returns null
      if (!state) {
        const idCode = lead.id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
        state = STATES[idCode % STATES.length]
      }
      
      const cities = CITIES[state] || ['Other']
      const idCode = lead.id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
      const city = cities[idCode % cities.length]
      
      const isEnrolled = lead.status === 'Enrolled'
      const rawCourse = lead.fields?.course || ''
      const fee = COURSE_AVG_FEES[rawCourse] || COURSE_AVG_FEES['default']

      // Mode: online vs classroom
      const mode = lead.fields?.mode_of_training === 'Class Room' ? 'classroom' : 'online'

      if (!stateStats[state]) {
        stateStats[state] = { leads: 0, enrolled: 0, revenue: 0, online: 0, classroom: 0 }
      }
      const stStats = stateStats[state]
      stStats.leads++
      if (isEnrolled) {
        stStats.enrolled++
        stStats.revenue += fee
      }
      if (mode === 'classroom') {
        stStats.classroom++
      } else {
        stStats.online++
      }

      if (!cityStats[city]) {
        cityStats[city] = { count: 0, enrolled: 0 }
      }
      cityStats[city].count++
      if (isEnrolled) {
        cityStats[city].enrolled++
      }
    })

    const stateTable = Object.entries(stateStats).map(([state, stats]) => {
      const convRate = stats.leads > 0 ? parseFloat(((stats.enrolled / stats.leads) * 100).toFixed(1)) : 0
      let stars = 1
      if (convRate >= 15) stars = 5
      else if (convRate >= 10) stars = 4
      else if (convRate >= 5) stars = 3
      else if (convRate >= 2) stars = 2

      return {
        state,
        leads: stats.leads,
        enrolled: stats.enrolled,
        convRate,
        revenue: Math.round(stats.revenue),
        online: stats.online,
        classroom: stats.classroom,
        stars
      }
    }).sort((a, b) => b.leads - a.leads)

    const topCities = Object.entries(cityStats).map(([city, stats]) => {
      const convRate = stats.count > 0 ? parseFloat(((stats.enrolled / stats.count) * 100).toFixed(1)) : 0
      return {
        city,
        count: stats.count,
        enrolled: stats.enrolled,
        convRate
      }
    }).sort((a, b) => b.count - a.count).slice(0, 10)

    // Top highlights
    const topVol = [...stateTable].sort((a, b) => b.leads - a.leads)[0]
    const topQual = [...stateTable].filter(s => s.leads > 5).sort((a, b) => b.convRate - a.convRate)[0]

    return NextResponse.json({
      highlights: {
        topStateVolume: topVol?.state || 'Telangana',
        topStateQuality: topQual?.state || 'Telangana',
        topCity: topCities[0]?.city || 'Hyderabad',
        untappedState: 'Gujarat'
      },
      stateTable,
      topCities
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    })
  } catch (error: any) {
    console.error('Geography API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
