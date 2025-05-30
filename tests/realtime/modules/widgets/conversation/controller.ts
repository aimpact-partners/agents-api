import { PageReactWidgetController } from '@beyond-js/react-18-widgets/page';
import Recorder from './widget';

export /*bundle*/
class Controller extends PageReactWidgetController {
	get Widget() {
		return Recorder;
	}
}
