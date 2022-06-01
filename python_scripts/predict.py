import pickle
import sys
import pandas as pd
import numpy as np
import warnings
import json
warnings.filterwarnings("ignore")

model=pickle.load(open(r'C:\Users\mittu\Desktop\node\Testing\python_scripts\car_price_predictor-master\LinearRegressionModel.pkl','rb'))
car=pd.read_csv(r'C:\Users\mittu\Desktop\node\Testing\python_scripts\car_price_predictor-master\Cleaned_Car_data.csv')

formData = str(sys.argv[1:][0])
resultDict = json.loads(formData)

# print(resultDict)
# print(formData)

company= resultDict['company']

car_model= resultDict['car_model']
year= int(resultDict['year'])
fuel_type= resultDict['fuel_type']
driven= int(resultDict['kilo_driven'])


prediction=model.predict(pd.DataFrame(columns=['name', 'company', 'year', 'kms_driven', 'fuel_type'],
                            data=np.array([car_model,company,year,driven,fuel_type]).reshape(1, 5)))

answerDict = {
    'prediction' : float(str(np.round(prediction[0]))), 
}

if prediction < 0  :
    print('This Car Cannot be Sold')
else :
    # print(' "Prediction: Rupees" {} '.format(str(np.round(prediction[0]))))
    print(answerDict)

