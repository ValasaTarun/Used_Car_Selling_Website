import pickle
import pandas as pd
import numpy as np
import warnings
import json
warnings.filterwarnings("ignore")

model=pickle.load(open(r'C:\Users\mittu\Desktop\node\Testing\python_scripts\car_price_predictor-master\LinearRegressionModel.pkl','rb'))
car=pd.read_csv(r'C:\Users\mittu\Desktop\node\Testing\python_scripts\car_price_predictor-master\Cleaned_Car_data.csv')


companies=sorted(car['company'].unique())
car_models=sorted(car['name'].unique())
year=sorted(car['year'].unique(),reverse=True)
fuel_type=car['fuel_type'].unique()

companies.insert(0,'Select Company')

iterArray = [companies,car_models,year,fuel_type]


def stringify(list):
    temp = ''

    for i in list:
        temp += str(i) + ','

    temp = temp[:len(temp)-1]

    return temp

# print(stringify(companies))
# print(stringify(car_models))
# print(stringify(year))
# print(stringify(fuel_type))


resultDict = {
    'companies':stringify(companies),
    'car_models':stringify(car_models),
    'year':stringify(year),
    'fuel_type':stringify(fuel_type),
}



# print(companies,car_models,year,fuel_type)

# print(resultDict)

# for key,value in resultDict.items():
#     print(key,value,end='\n')

print(json.dumps(resultDict))


