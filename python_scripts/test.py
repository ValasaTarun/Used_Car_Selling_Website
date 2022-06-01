import sys
import json
import pickle
import string
from nltk.corpus import stopwords
import nltk
from nltk.stem.porter import PorterStemmer
import warnings
warnings.filterwarnings("ignore")

ps = PorterStemmer()

def transform_text(text):
    text = text.lower()
    text = nltk.word_tokenize(text)

    y = []
    for i in text:
        if i.isalnum():
            y.append(i)

    text = y[:]
    y.clear()

    for i in text:
        if i not in stopwords.words('english') and i not in string.punctuation:
            y.append(i)

    text = y[:]
    y.clear()

    for i in text:
        y.append(ps.stem(i))

    return " ".join(y)

tfidf = pickle.load(open(r'C:\Users\mittu\Desktop\node\Testing\python_scripts\vectorizer.pkl','rb'))
model = pickle.load(open(r'C:\Users\mittu\Desktop\node\Testing\python_scripts\model.pkl','rb'))


formData = str(sys.argv[1:][0])
resultDict = json.loads(formData)

# print(type(resultDict))
# print(type(formData))

# for key,value in resultDict.items():
#     print(' key = {} , value = {}'.format(key,value))

transformed_sms = transform_text(resultDict['name'])

vector_input = tfidf.transform([transformed_sms])

result = model.predict(vector_input)[0]


resultDict['Result'] = 'Not Spam'  if result == 0  else 'Spam'
jsonData = json.dumps(resultDict)
print(jsonData)
# print('Result = ',result)

# sys.stdout.write(str(result))
# sys.stdout.write(str(array))

# if result == 1:
#         print("Spam")
# else:
#     print("Not Spam")

# print(' Form Data = {}'.format(resultDict['name'])) 
