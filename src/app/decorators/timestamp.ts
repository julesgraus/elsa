import moment from 'moment';
import 'moment/locale/nl';
moment.locale('nl');

export default function timestamp(format:string = 'HH:mm') { //Decorator factory
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => { //Decorator
    const originalFn = descriptor.value;

    descriptor.value = function (...args: any[]) {
      let returnValue = originalFn.apply(this, args);
      if(
        typeof returnValue === 'string' ||
        typeof returnValue === 'number'
      ) {
        const currentTimeDate = moment().format(format)
        returnValue = '[' + currentTimeDate + '] ' + returnValue;
      }
      return returnValue;
    }
  }
}
